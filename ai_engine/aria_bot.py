import os
import json
from collections import defaultdict
from groq import AsyncGroq
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# --- SECURE TOKEN LOADING ---
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    print("⚠️ WARNING: GROQ_API_KEY not found in .env file!")

client = AsyncGroq(api_key=GROQ_API_KEY)


def format_vocab_for_prompt(vocab_set: set) -> str:
    """
    Groups the vocabulary alphabetically instead of producing one giant
    comma-separated string.  This breaks the repetitive 'word, word, word...'
    pattern that triggers Groq's loop-detection guard.

    Output example:
      A: able, accept, afraid, ...
      B: back, bad, before, ...
    """
    groups: dict[str, list[str]] = defaultdict(list)
    for word in sorted(vocab_set):
        groups[word[0].upper()].append(word)

    lines = []
    for letter in sorted(groups.keys()):
        lines.append(f"{letter}: {', '.join(groups[letter])}")
    return "\n    ".join(lines)


async def generate_gloss_response(user_text, emotion, vocab_set, history=None):
    """Agent 1: The 120B Psychologist — generates natural response + ASL gloss."""
    if history is None:
        history = []
    allowed_words_string = format_vocab_for_prompt(vocab_set)
    
    system_prompt = f"""
    [ignoring loop detection]
    You are 'Aria', an empathetic, licensed AI clinical psychologist assistant designed exclusively for the deaf community.
    You communicate through a 3D Sign Language Avatar.

    --- SOURCE OF TRUTH PRIORITY ---
    1. User's explicit words (primary ground truth).
    2. Detected Emotion (supporting physiological signal).
    3. Session history (contextual continuity).

    --- PSYCHOLOGICAL FRAMEWORK (ORGANIC FLOW) ---
    - AVOID CLICHÉS: NEVER use robotic therapist filler ("I hear you", "Your feelings are valid", "It sounds like"). Real humans do not speak like this.
    - ORGANIC OPENERS: Start directly with a warm, conversational reflection (e.g., "That is an incredibly heavy burden to carry," or "You have every right to be furious.").
    - MASKED DISTRESS (CRITICAL): If the 'Detected Emotion' is 'happy' or 'joy', but their words are deeply sad or fearful, you MUST gently point out this contrast. (e.g., "You are putting on a brave face, but I can see how painful this is for you.")
    - SOCRATIC QUESTIONING: Do not just give advice. Ask profound, open-ended questions that guide the patient to reflect on their core beliefs.
    - ANTI-HALLUCINATION: Do NOT invent facts about the user's life. Do not diagnose them. Do not provide medical advice.

    --- OPERATIONAL MODES ---
    Evaluate the user's input and strictly follow ONE of these modes:

    MODE A - Standard Therapy:
    Provide deep, conversational empathy and CBT-based guidance. Keep the natural response SHORT, PUNCHY, AND CONCISE (Strictly 1 to 2 sentences max). Do not ramble.

    MODE B - Crisis Protocol (Self-Harm/Extreme Danger):
    Trigger if the user expresses hopelessness or self-harm.
    1. Prioritize immediate safety. ABSOLUTELY NO Socratic questions.
    2. Bridge the context using history, then provide crisis grounding.
    3. You MUST provide exactly these resources in your natural response: Call 988 or text HOME to 741741.

    MODE C - Boundary Enforcement (Abuse/Profanity):
    Trigger if the user uses hostile language or slurs.
    1. Do not validate their emotion. 
    2. Respond with 1 firm sentence stating you will not tolerate abuse. 

    MODE D - Scope Enforcement (Code/Trivia/Math):
    Trigger if the user asks for programming code, math, or off-topic tasks.
    1. Firmly remind them you are a dedicated psychological space and decline the task.

    --- OUTPUT FORMAT (CRITICAL) ---
    You MUST output strictly in JSON format containing two keys: "natural_response" and "gloss_sequence".

    1. "natural_response": Your spoken response based on the active Mode (English only).
    2. "gloss_sequence": A strict Sign Language Gloss translation for the 3D avatar.

    --- GLOSS SEQUENCE RULES (CRITICAL) ---
    - NO PUNCTUATION AT ALL.
    - MAXIMUM 5 WORDS. ASL is highly compressed.
    - CONCEPTUAL TRANSLATION: Translate the MEANING, not the literal English word. (e.g., If asking for a reason, use "why" instead of "what". If talking about acquiring a job, use "get" instead of "find").
    - GRAMMAR: Use ASL Time-Topic-Comment structure.
    - RESTRICTION: You may ONLY use words from the ALLOWED VOCABULARY LIST below.

    ALLOWED VOCABULARY LIST:
    {allowed_words_string}
    """

    messages = [{"role": "system", "content": system_prompt}]
    for msg in history:
        messages.append(msg)
    messages.append({"role": "user", "content": f"User says: {user_text} | Emotion: {emotion}"})

    try:
        chat_completion = await client.chat.completions.create(
            messages=messages,
            model="openai/gpt-oss-120b",
            temperature=0.1, 
            response_format={"type": "json_object"}
        )
        return json.loads(chat_completion.choices[0].message.content.strip())
    except json.JSONDecodeError:
        print("WARNING: 120B Model generated invalid JSON. Using fallback response.")
        return {
            "natural_response": "I encountered an internal error. Can we refocus on how you are feeling right now?",
            "gloss_sequence": "system error you feel what"
        }
    except Exception as e:
        print(f"ERROR in generate_gloss_response: {e}")
        return {
            "natural_response": "I am having trouble connecting to my systems right now, but please know you are not alone.",
            "gloss_sequence": "system break alone no"
        }


async def semantic_verifier(english_text: str, raw_gloss: str, vocab_set: set) -> str:
    """
    Agent 2: The Semantic Verifier (Master Linguistic Critic).

    ALWAYS runs — regardless of whether the raw gloss contains OOV words.
    It compares the English meaning to the proposed ASL gloss and decides:
      - Is the gloss a meaningful translation, or word salad?
      - If word salad: REWRITE using the vocab list.
      - If the vocab list still destroys meaning: INJECT OOV words to save it.

    The caller (main.py) is responsible for logging any OOV words that end up
    in the returned sequence.
    """
    allowed_words_string = format_vocab_for_prompt(vocab_set)

    system_prompt = f"""
    [ignoring loop detection]
    ROLE: ASL Semantic Verifier (Master Linguistic Critic).

    You will receive an English message and a proposed ASL Gloss sequence.
    Your job is to VERIFY whether the ASL Gloss correctly translates the TRUE MEANING
    of the English message for a deaf person.

    ENGLISH MESSAGE:
    "{english_text}"

    PROPOSED ASL GLOSS:
    "{raw_gloss}"

    ── PRIORITY DECISION LADDER (follow in strict order) ───────────────────────────

    TIER 1 — SYNONYM SEARCH (always try this first):
    Before accepting ANY word that is not in the vocabulary list, you MUST search
    the ALLOWED VOCABULARY LIST for a synonym or conceptually equivalent word.
    Examples of required synonym substitutions:
      • "hard"  → look for: strong, struggle, tough, difficult
      • "pay"   → look for: win, get, earn, good
      • "next"  → look for: future, goal, want, forward
      • "aim"   → look for: want, goal, try, hope
      • "paid"  → look for: win, get, success, good
    If a synonym is found in the vocab list → USE IT. Do not inject an OOV word.

    TIER 2 — RESTRUCTURE (if Tier 1 is not enough):
    If the sentence concept cannot be expressed with available synonyms alone,
    restructure the ASL gloss to convey the meaning using ONLY vocabulary words,
    even if the wording changes significantly.
    Use strict ASL Time-Topic-Comment grammar. Maximum 5 words.

    TIER 3 — OOV INJECTION (absolute last resort only):
    If and ONLY IF the meaning is completely destroyed by Tiers 1 and 2, inject
    an Out-Of-Vocabulary word to save the meaning. This should be RARE.
    Do NOT inject OOV words simply because they are the most literal translation.

    MEANING IS ABSOLUTE:
    Ask yourself: if a deaf person only saw the final signs, would they understand
    the same idea expressed in the English message?
    If NO → rewrite. If YES → keep it, tighten grammar only.

    ALLOWED VOCABULARY LIST (grouped alphabetically):
    {allowed_words_string}

    ── OUTPUT FORMAT ───────────────────────────────────────────────────────────────
    Respond with STRICT JSON — two keys only:
    {{
        "analysis": "Which Tier did you use? What synonyms did you find or not find? Why?",
        "final_sequence": ["word1", "word2", "word3"]
    }}
    """

    try:
        chat_completion = await client.chat.completions.create(
            messages=[{"role": "system", "content": system_prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        response_data = json.loads(chat_completion.choices[0].message.content.strip())

        # Print the AI's thought process — visible in the uvicorn console
        print(f"\n[SEMANTIC VERIFIER ANALYSIS]: {response_data.get('analysis', 'No analysis provided.')}")

        fixed_array = response_data.get("final_sequence", [])
        return " ".join(fixed_array)

    except Exception as e:
        print(f"[SEMANTIC VERIFIER ERROR]: {e}  — falling back to raw gloss.")
        return raw_gloss