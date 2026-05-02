from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import os
import datetime
import json
import httpx
from dotenv import load_dotenv

from predictor import SignPredictor
from translator import GlossTranslator
from core_engine import load_vocabulary, mirror_filter
from aria_bot import generate_gloss_response, semantic_verifier

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Models
sign_engine = SignPredictor()
bart_engine = GlossTranslator()

# Initialize Aria Chatbot Brain
vocab_set = load_vocabulary("full_ai_categorized.txt")
print(f"✅ Aria Brain Ready: Loaded {len(vocab_set)} words into vocabulary.")


# ==========================================
# SIGN LANGUAGE ENDPOINTS (Unchanged)
# ==========================================
@app.get("/")
def home():
    return {"status": "QuietCare AI Brain is Active"}

@app.post("/predict-frame")
async def predict_frame(file: UploadFile = File(...)):
    """
    Returns per-frame sign and emotion data.
    Response shape:
      {
        "gloss":   string | null,   ← confirmed sign word (null when mid-gesture)
        "sign":    string | null,   ← same as gloss (alias for clarity)
        "emotion": string           ← live FER emotion for this frame
      }
    """
    image_bytes = await file.read()
    result = sign_engine.process_frame(image_bytes)
    return {
        "gloss":   result["sign"],   # backward-compat alias kept for VideoStage
        "sign":    result["sign"],
        "emotion": result["emotion"],
    }

@app.post("/translate")
async def translate_gloss(gloss_text: str = Form(...)):
    sentence = bart_engine.translate(gloss_text)
    return {"sentence": sentence}


# ==========================================
# ARIA CHATBOT ENDPOINT (Upgraded)
# ==========================================

async def _run_aria_pipeline(user_text: str, emotion: str, history: list) -> dict:
    """
    The full Aria pipeline (Semantic Verifier Architecture):
    1. Agent 1 (120B Psychologist)  → natural English response + first-pass ASL gloss
    2. Agent 2 (Semantic Verifier)  → ALWAYS compares English meaning to the gloss;
                                      rewrites word-salad; injects OOV words if needed
                                      to PRESERVE MEANING over dictionary compliance.
    3. Mirror Filter                → catches any OOV words the verifier injected,
                                      keeps them in the sequence, and returns the list
                                      so we can log them as animations to build.
    """
    # Session Memory Management — keep only last 10 messages (5 turns)
    if len(history) > 10:
        history = history[-10:]

    # ── STEP 1: Agent 1 — Psychologist generates English + first-pass gloss ──────
    ai_data = await generate_gloss_response(user_text, emotion, vocab_set, history)
    natural_text = ai_data.get("natural_response", "I am here to support you.")
    raw_gloss = ai_data.get("gloss_sequence", "").lower()

    print(f"\n[AGENT 1 RAW GLOSS]: '{raw_gloss}'")
    print(f"[AGENT 1 ENGLISH  ]: '{natural_text}'")

    # ── STEP 2: Agent 2 — Semantic Verifier ALWAYS runs ─────────────────────────
    # It compares the English meaning to the raw gloss and either:
    #   a) confirms it is valid and tightens the grammar, OR
    #   b) rewrites it, injecting OOV words when the vocabulary list alone
    #      would produce meaningless word salad.
    verified_gloss = await semantic_verifier(natural_text, raw_gloss, vocab_set)

    # ── STEP 3: Mirror Filter — catches any OOV words the verifier injected ─────
    # The filter KEEPS every word (including OOV ones) in the sequence so the
    # frontend / Unity receives the full, meaningful array.
    # It also returns the OOV words separately so we can warn the developer.
    final_sequence, missing_unanimated_words = mirror_filter(verified_gloss, vocab_set)

    # ── STEP 4: Developer Warning System ────────────────────────────────────────
    if missing_unanimated_words:
        print("\n=======================================================")
        print("⚠️  MEANING PRESERVATION OVERRIDE TRIGGERED")
        print(f"   English Msg : '{natural_text}'")
        print(f"   Raw Gloss   : '{raw_gloss}'")
        print(f"   Verified    : '{verified_gloss}'")
        print(f"   OOV Words   : {missing_unanimated_words}")
        print("   ➡  These words need Blender animations. See missing_animations.log")
        print("=======================================================\n")

        # Append to the developer's animated-words to-do list
        with open("missing_animations.log", "a") as log_file:
            timestamp = datetime.datetime.now().isoformat()
            log_file.write(
                f"[{timestamp}] MEANING OVERRIDE | "
                f"English: '{natural_text}' | "
                f"OOV Words Needed: {missing_unanimated_words}\n"
            )
    else:
        print(f"[VERIFIED GLOSS ✅]: {final_sequence} — all words in vocabulary.")

    return {
        "status": "success",
        "natural_response": natural_text,
        "original_gloss": raw_gloss,          # first-pass from Agent 1 (for debugging)
        "dropped_words": missing_unanimated_words,  # OOV words (need animations)
        "animation_sequence": final_sequence  # FULL verified sequence → Unity
    }


@app.post("/chat-response")
async def chat_response(request: Request):
    """
    Accepts BOTH:
    - FormData:  user_text (required), emotion (optional), history (optional JSON string)
    - JSON Body: { user_text, emotion, history[] }
    
    Returns the same format as QuiteCare_Chatbot:
    {
        "status": "success",
        "natural_response": "Full English reply for the chat box",
        "original_gloss": "raw gloss string from AI",
        "dropped_words": [],
        "animation_sequence": ["you", "strong", "good"]
    }
    """
    try:
        content_type = request.headers.get("content-type", "")
        
        if "multipart/form-data" in content_type or "application/x-www-form-urlencoded" in content_type:
            # --- FORM DATA (from the React frontend) ---
            form = await request.form()
            user_text = form.get("user_text", "")
            emotion = form.get("emotion", "neutral")
            history_raw = form.get("history", "[]")
            try:
                history = json.loads(history_raw) if isinstance(history_raw, str) else []
            except json.JSONDecodeError:
                history = []
        else:
            # --- JSON BODY (from Gradio / Postman / API clients) ---
            body = await request.json()
            user_text = body.get("user_text", "")
            emotion = body.get("emotion", "neutral")
            history = body.get("history", [])
        
        if not user_text:
            raise HTTPException(status_code=400, detail="user_text is required")

        # EMOTION PIPELINE LOG
        # Visible in the uvicorn terminal so you can confirm emotion is reaching
        # the backend during live testing.
        sep = "-" * 52
        print(f"\n{sep}")
        print(f"  [EMOTION RECEIVED] --> {emotion.upper()}")
        print(f"  [USER TEXT]        --> \"{user_text[:60]}{'...' if len(user_text) > 60 else ''}\"")
        print(sep)

        return await _run_aria_pipeline(user_text, emotion, history)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Chat Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Ensure GROQ_API_KEY is loaded in ai_engine/.env
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

class ChatMessage(BaseModel):
    sender: str
    text: str

class TitleRequest(BaseModel):
    messages: List[ChatMessage]

@app.post("/generate-title")
async def generate_title(request: TitleRequest):
    """
    Takes a list of messages and uses Groq (llama-3.1-8b-instant) 
    to generate a 3 to 5 word summary title.
    """
    if len(request.messages) < 3:
        return {"title": "New Sign Session"}

    # Take the first 5 messages to establish the context
    first_few_msgs = request.messages[:5]
    convo_string = "\n".join(
        [f"{m.sender}: {m.text}" for m in first_few_msgs if "Thinking" not in m.text]
    )

    if not GROQ_API_KEY:
        print("⚠️ Warning: GROQ_API_KEY not found in ai_engine/.env. Using fallback title.")
        return {"title": "Sign Language Conversation"}

    try:
        # Use httpx for a fast, async call to Groq
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama-3.1-8b-instant",
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are an AI that creates titles for sign language conversations. Analyze the provided chat history and understand what was discussed. Generate a short, descriptive title. The title MUST be exactly 3 to 5 words long. Do not include quotes, punctuation, or any extra text."
                        },
                        {"role": "user", "content": convo_string}
                    ],
                    "max_tokens": 10,
                    "temperature": 0.3
                },
                timeout=5.0 # Don't hang the server if Groq is slow
            )
            
            response.raise_for_status()
            data = response.json()
            generated_title = data["choices"][0]["message"]["content"].strip()
            return {"title": generated_title}

    except Exception as e:
        print(f"Error calling Groq for title: {e}")
        return {"title": "Sign Language Conversation"}