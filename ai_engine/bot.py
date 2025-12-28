from huggingface_hub import InferenceClient
import contractions
import spacy
import os
from dotenv import load_dotenv # [NEW] Import dotenv

# 1. Load Environment Variables from .env file
load_dotenv()

# 2. Load SpaCy
try:
    nlp = spacy.load("en_core_web_sm")
except:
    print("Downloading SpaCy model...")
    os.system("python -m spacy download en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

# 3. Config & Constants
DIRECTIONAL_ADP = {"to", "from", "on", "in", "at", "into", "onto"}
WH_TAGS = {"WDT", "WP", "WP$", "WRB"}

# --- SECURE TOKEN LOADING ---
# This reads 'HF_TOKEN' directly from your .env file
HF_TOKEN = os.getenv("HF_TOKEN")

if not HF_TOKEN:
    print("⚠️ WARNING: HF_TOKEN not found in .env file!")

# Model Config
MODEL_NAME = "meta-llama/Llama-3.1-8B-Instruct" 

class PsychologistBot:
    def __init__(self):
        print(f"Loading Psychologist Bot ({MODEL_NAME})...")
        self.client = InferenceClient(model=MODEL_NAME, token=HF_TOKEN)
        
        # System Prompt
        self.system_prompt = {
            "role": "system", 
            "content": (
                "You are a kind psychologist. Your goal is to motivate and encourage the user. "
                "Stay positive and offer hope. Reply in only one or two very short, simple sentences. "
                "Remind them of their strength."
            )
        }
        self.chat_history = [self.system_prompt]

    def text_to_gloss(self, sentence):
        """
        Your custom general_glosser logic
        """
        if not sentence: return ""
        
        try:
            sentence = contractions.fix(sentence)
            doc = nlp(sentence)
            
            gloss_tokens = []
            wh_tokens = []
            neg_tokens = []

            for token in doc:
                if token.is_punct or token.is_space:
                    continue

                if token.tag_ in WH_TAGS:
                    wh_tokens.append(token.text.upper())
                    continue

                if token.dep_ == "neg":
                    neg_tokens.append(token.text.upper())
                    continue

                pos = token.pos_
                dep = token.dep_
                text_lower = token.text.lower()

                if pos == "DET": continue
                if pos == "AUX": continue

                if pos == "ADP":
                    if text_lower not in DIRECTIONAL_ADP or dep == "mark": 
                        continue
                
                if pos == "PART" and text_lower == "to":
                    continue

                if pos in {"NOUN", "VERB", "ADJ", "ADV", "PRON", "PROPN", "CCONJ"} or dep == "poss":
                    if pos == "VERB":
                        gloss_tokens.append(token.lemma_.upper())
                    else:
                        gloss_tokens.append(token.text.upper())

            result = gloss_tokens + neg_tokens + wh_tokens
            return " ".join(result)
            
        except Exception as e:
            print(f"Glossing Error: {e}")
            return sentence.upper()

    def get_response(self, user_text):
        """Get AI response and convert to Gloss"""
        print(f"Bot received: {user_text}")
        
        self.chat_history.append({"role": "user", "content": user_text})

        try:
            full_response = ""
            for message in self.client.chat_completion(
                messages=self.chat_history,
                max_tokens=70, 
                temperature=0.35, 
                stream=True,
            ):
                if message.choices and message.choices[0].delta.content:
                    token = message.choices[0].delta.content
                    full_response += token

            print(f"Bot reply: {full_response}")
            
            self.chat_history.append({"role": "assistant", "content": full_response})

            gloss_response = self.text_to_gloss(full_response)
            
            return full_response, gloss_response

        except Exception as e:
            print(f"Bot Error: {e}")
            fallback = "You are strong."
            return fallback, "YOU STRONG"