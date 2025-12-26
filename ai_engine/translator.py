from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import os
import torch

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")

# Update these folder names if yours are slightly different
TOKENIZER_PATH = os.path.join(MODELS_DIR, "Glossa-BART-Tokenizer")
MODEL_PATH = os.path.join(MODELS_DIR, "Glossa-BART-Model")

class GlossTranslator:
    def __init__(self):
        print("Loading BART Translator...")
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(TOKENIZER_PATH)
            self.model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_PATH)
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            self.model.to(self.device)
            print("BART Translator Loaded Successfully.")
        except Exception as e:
            print(f"Error loading BART: {e}")
            self.model = None

    def translate(self, gloss_text):
        if not self.model or not gloss_text:
            return gloss_text # Return original if model fails
        
        inputs = self.tokenizer(gloss_text, return_tensors="pt").to(self.device)
        with torch.no_grad():
            outputs = self.model.generate(**inputs, max_length=50)
        
        sentence = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        return sentence