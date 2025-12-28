from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from predictor import SignPredictor
from translator import GlossTranslator
from bot import PsychologistBot  # [NEW] Import Bot

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Models
sign_engine = SignPredictor()
bart_engine = GlossTranslator()
psych_bot = PsychologistBot() # [NEW] Initialize Bot

@app.get("/")
def home():
    return {"status": "QuietCare AI Brain is Active"}

@app.post("/predict-frame")
async def predict_frame(file: UploadFile = File(...)):
    image_bytes = await file.read()
    detected_gloss = sign_engine.process_frame(image_bytes)
    return {"gloss": detected_gloss}

@app.post("/translate")
async def translate_gloss(gloss_text: str = Form(...)):
    sentence = bart_engine.translate(gloss_text)
    return {"sentence": sentence}

# [NEW] Chat Response Endpoint
@app.post("/chat-response")
async def chat_response(user_text: str = Form(...)):
    """
    Receives: "I am feeling sad"
    Returns: { 
        "reply": "It is okay to feel sad.", 
        "gloss": "IT OKAY FEEL SAD" 
    }
    """
    reply, gloss = psych_bot.get_response(user_text)
    return {"reply": reply, "gloss": gloss}