from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from predictor import SignPredictor
from translator import GlossTranslator

app = FastAPI()

# 1. Allow React (Client) to access this Server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Initialize Models (This runs once when server starts)
sign_engine = SignPredictor()
bart_engine = GlossTranslator()

@app.get("/")
def home():
    return {"status": "QuietCare AI Brain is Active"}

@app.post("/predict-frame")
async def predict_frame(file: UploadFile = File(...)):
    """
    Receives an image frame, runs MediaPipe + Transformer.
    Returns: The detected gloss (e.g., "HELLO") or null.
    """
    image_bytes = await file.read()
    detected_gloss = sign_engine.process_frame(image_bytes)
    return {"gloss": detected_gloss}

@app.post("/translate")
async def translate_gloss(gloss_text: str = Form(...)):
    """
    Receives a string of glosses (e.g., "HELLO ME SAD").
    Returns: Correct English (e.g., "Hello, I am sad.").
    """
    sentence = bart_engine.translate(gloss_text)
    return {"sentence": sentence}
