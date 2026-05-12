# QuiteCare AI Engine
## Technical Documentation for FYP Presentation

---

# 1. Project Overview

**QuiteCare AI** is a comprehensive system that enables deaf individuals to communicate through sign language with an empathetic AI assistant called "Aria" - a 3D avatar that provides psychological support.

The system performs three main functions:
1. **Real-time Sign Language Recognition** - Converts sign gestures to text/gloss
2. **Emotion Detection** - Analyzes facial expressions to understand user emotional state
3. **AI Chatbot** - Provides empathetic responses displayed through a 3D sign language avatar

---

# 2. Major Features & Components

## 2.1 Sign Language Recognition (Real-time)

### Model Architecture
- **Type**: Custom PyTorch Transformer Classifier
- **Architecture Details**:
  - Transformer Encoder with BatchNorm
  - `d_model=256`, `nhead=4`, `num_layers=2`, `dropout=0.4`
  - Input: 1662-dimensional keypoint features
  - Output: 2000+-class sign predictions (dynamic from labels.txt)

### Input Processing
| Component | Description |
|-----------|-------------|
| Pose Keypoints | 33 landmarks × 4 coordinates = 132 features |
| Face Keypoints | 468 landmarks × 3 coordinates = 1,404 features |
| Left Hand | 21 landmarks × 3 coordinates = 63 features |
| Right Hand | 21 landmarks × 3 coordinates = 63 features |
| **Total** | **1,662 features per frame** |

### Configuration
- **Sequence Length**: 50 frames
- **Prediction Rate**: Every 5 frames
- **Motion Thresholds**: Start=0.02, End=0.01
- **Stability Frames**: 8 consecutive frames to confirm end of sign
- **Majority Vote**: 50% threshold across 15 predictions

### Key Files
- `predictor.py` - Main sign prediction engine
- `models/final_model_all1.pth` - Trained PyTorch weights
- `models/labels.txt` - 2000+ sign class labels (dynamic)

---

## 2.2 Emotion Recognition (Facial Expression Recognition)

### Model Architecture
- **Type**: Custom Keras CNN
- **Framework**: TensorFlow/Keras
- **File**: `models/fer_best_model_v2_diverse.keras`
- **Labels**: 7 emotions - Angry, Disgust, Fear, Happy, Neutral, Sad, Surprise

### Processing Pipeline
```
Frame → Face Detection → Grayscale → CLAHE → 112×112 → Normalize → CNN → Emotion
```

| Step | Details |
|------|---------|
| Face Detection | MediaPipe face landmarks (468 points) |
| Bounding Box | 30-pixel padding around face |
| Preprocessing | Grayscale conversion + CLAHE enhancement |
| Resize | 112×112 using INTER_CUBIC |
| Normalization | Pixel values / 255 |

### Key Features
- Runs **every frame** parallel to sign recognition
- Uses same MediaPipe results (no extra computation)
- Cross-version Keras compatibility (2.x ↔ 3.x)
- File: `emotion_predictor.py`

---

## 2.3 Gloss-to-English Translation

### Model
- **Type**: Glossa-BART (Seq2Seq)
- **Framework**: HuggingFace Transformers
- **Input**: ASL gloss sequences (e.g., "hello how you")
- **Output**: Natural English sentences (e.g., "How are you?")

### Files
- `translator.py` - Translation wrapper
- `models/Glossa-BART-Model/` - Model weights
- `models/Glossa-BART-Tokenizer/` - Tokenizer

---

## 2.4 Aria Chatbot (Multi-Agent LLM System)

### Overview
A sophisticated 3-agent pipeline that generates empathetic responses for the 3D avatar:

```
User Message + Emotion → Agent 1 (120B) → Agent 2 (70B) → Mirror Filter → Response
```

### Agent 1: The 120B Psychologist
- **Model**: Groq `openai/gpt-oss-120b`
- **Role**: Generate natural English response + first-pass ASL gloss
- **System Prompt Includes**:
  - Detected facial emotion analysis
  - Psychological frameworks (CBT, Socratic questioning)
  - 4 Operational Modes
  - Vocabulary constraints (907 words)

### Agent 2: Semantic Verifier
- **Model**: Groq `llama-3.3-70b-versatile`
- **Role**: Validate and rewrite gloss to preserve meaning
- **Priority Ladder**:
  1. **Synonym Search** - Find equivalent words in vocabulary
  2. **Restructure** - Change word order for ASL grammar
  3. **OOV Injection** - Last resort: add out-of-vocabulary words

### Agent 3: Mirror Filter
- **Role**: Catches OOV words, logs them for animation development
- **Output**: Full sequence + missing words list
- **Log File**: `missing_animations.log`

### Vocabulary Database
- **Total Words**: 907 allowed words
- **Categories**:
  - Grammar (166 words): basic ASL grammar structure
  - Conversation (575 words): everyday vocabulary
  - Psychology (166 words): emotional/therapeutic terms

---

## 2.5 Operational Modes

| Mode | Trigger | Response |
|------|---------|----------|
| **Standard Therapy** | Normal conversation | Short, punchy empathetic response (1-2 sentences) |
| **Crisis Protocol** | Self-harm/hopelessness | Immediate safety focus + resources (988, HOME to 741741) |
| **Boundary Enforcement** | Hostile language/slurs | Firm refusal (1 sentence) |
| **Scope Enforcement** | Code/math/off-topic | Firm reminder of purpose |

---

## 2.6 Emotion-Aware Response System

The chatbot analyzes **both** text and facial emotion:

| Scenario | Response Strategy |
|----------|-------------------|
| Emotion ALIGNS with words | Deepen empathy (e.g., sad words + sad face) |
| Emotion CONTRADICTS words | Gently surface contradiction ("You say you're okay, but I can see...") |
| Happy face + Distressing words | MASKED DISTRESS protocol |
| Neutral emotion | Focus on words content |

---

# 3. API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/predict-frame` | POST | Real-time sign + emotion from image |
| `/translate` | POST | Gloss-to-English conversion |
| `/chat-response` | POST | Aria chatbot pipeline |
| `/generate-title` | POST | Session title (Llama 3.1 8B) |

---

# 4. Technology Stack

| Category | Technology |
|----------|------------|
| API Framework | FastAPI, Uvicorn |
| Sign Model | PyTorch 2.11, Transformer |
| Emotion Model | TensorFlow/Keras CNN |
| Translation | HuggingFace BART |
| LLM API | Groq (Llama 3.1, Llama 3.3) |
| Pose Detection | MediaPipe Holistic |
| Computer Vision | OpenCV 4.13 |

---

# 5. Model Calling Flow

## Sign + Emotion Detection Flow
```
User Video Frame
       ↓
┌─────────────────────────┐
│  MediaPipe Holistic     │  Extracts 1662 keypoints
│  (Pose + Face + Hands)  │  Every frame
└───────────┬─────────────┘
            ↓
┌─────────────────────────┐
│  SignPredictor.py      │
├─────────────────────────┤
│  → Transformer (.pth)  │  Sign prediction (50 classes)
│  → EmotionDetector     │  7-class FER
│     (.keras)            │
└───────────┬─────────────┘
            ↓
    {sign: "hello", emotion: "happy"}
```

## Chatbot Response Flow
```
User Message + Emotion
       ↓
┌──────────────────────────────────────┐
│  app.py: _run_aria_pipeline         │
├──────────────────────────────────────┤
│  1. generate_gloss_response()       │  Groq 120B
│     Agent 1 - Psychologist           │  → natural_response + raw_gloss
├──────────────────────────────────────┤
│  2. semantic_verifier()             │  Groq Llama 70B
│     Agent 2 - Linguistic Critic     │  → validated_gloss
├──────────────────────────────────────┤
│  3. mirror_filter()                 │  Core engine
│     OOV detection                   │  → final_sequence + dropped_words
└──────────────┬───────────────────────┘
               ↓
{
  "natural_response": "I'm here to support you.",
  "animation_sequence": ["you", "strong", "good"],
  "dropped_words": []
}
```

---

# 6. Panel Questions & Answers

## Q1: How does your system handle out-of-vocabulary words?
**A:** We use a 3-agent pipeline with a priority ladder:
1. **Synonym Search** - Look for equivalent words in 907-word vocabulary
2. **Restructure** - Change word order to fit ASL grammar
3. **OOV Injection** - Only as last resort; these are logged to `missing_animations.log` for developers to create animations later.

---

## Q2: How does emotion detection work in real-time?
**A:** Every video frame goes through:
- MediaPipe extracts 468 face landmarks → bounding box
- Convert to grayscale → CLAHE enhancement → 112×112 resize
- Pass through Keras CNN → 7-class probability output
- Runs parallel to sign recognition at ~30fps with minimal overhead.

---

## Q3: Why use two different LLM models for the chatbot?
**A:** Separation of concerns:
- **Agent 1 (120B)**: Expert in psychology and emotional understanding
- **Agent 2 (70B)**: Expert in ASL linguistics and grammar
This improves both response empathy and translation accuracy.

---

## Q4: How does the system ensure meaning isn't lost in translation?
**A:** The semantic verifier uses the question: *"If a deaf person only saw the final signs, would they understand the same idea?"* If NO, it rewrites. Priority: Synonym → Restructure → OOV Injection.

---

## Q5: What if user shows contradictory emotions (says "I'm fine" but looks sad)?
**A:** The 120B psychologist follows **MASKED DISTRESS protocol** - gently surfaces the contradiction: *"You say you're okay, but I can sense something else beneath that."*

---

## Q6: How many signs can your model recognize?
**A:**
- **Sign Recognition**: 2000+ sign classes (Transformer model - dynamically loaded from labels.txt)
- **Chatbot Vocabulary**: 907 allowed words for avatar animation

---

## Q7: What is the crisis protocol?
**A:** If user expresses hopelessness or self-harm:
- Prioritize immediate safety
- NO Socratic questions
- Provide resources: Call **988** or text **HOME to 741741**

---

## Q8: How do you handle Keras 2.x vs 3.x model compatibility?
**A:** Custom compatibility layer in `emotion_predictor.py`:
- Patches config: DTypePolicy dict → string
- Patches: batch_shape → input_shape
- Runtime patches for policy loading
- Falls back from ZIP extraction to direct load

---

## Q9: What is the purpose of the mirror filter?
**A:** It serves two purposes:
1. **Keeps all words** (including OOV) in the animation sequence
2. **Logs missing words** so developers know which animations to create

---

## Q10: How does the system decide when a sign is complete?
**A:** State machine with thresholds:
- **IDLE → RECORDING**: movement > 0.02 AND hand detected
- **RECORDING → IDLE**: movement < 0.01 for 8 consecutive frames

---

## Q11: What happens if GROQ_API_KEY is missing?
**A:** Fallback responses are provided:
- Agent 1: *"I am having trouble connecting to my systems right now, but please know you are not alone."*
- Gloss: *"system break alone no"*

---

## Q12: How do you optimize for real-time performance?
**A:**
- Fixed thresholds (no waiting 3 seconds)
- Prediction every 5 frames instead of every frame
- Majority voting with 15-frame queue
- Parallel emotion + sign detection from same MediaPipe results

---

# 7. File Structure

```
ai_engine/
├── app.py                    # FastAPI server + endpoints
├── predictor.py              # Sign language + emotion detection
├── emotion_predictor.py     # FER model + Keras compatibility
├── translator.py             # BART gloss-to-English
├── aria_bot.py               # Agent 1 (120B) + Agent 2 (70B)
├── core_engine.py            # Vocabulary loader + mirror filter
├── requirements.txt          # Dependencies
├── full_ai_categorized.txt   # 907-word vocabulary
├── missing_animations.log   # OOV word logging
└── models/
    ├── final_model_all1.pth  # PyTorch sign classifier
    ├── labels.txt            # 2000+ sign labels
    ├── fer_best_model_v2_diverse.keras  # FER model
    ├── mean_std.npz          # Normalization stats
    ├── Glossa-BART-Model/    # Translation model
    └── Glossa-BART-Tokenizer/
```

---

# 8. Dependencies

Key packages from `requirements.txt`:
- `fastapi==0.136.0` - Web framework
- `torch==2.11.0` - Sign model
- `tensorflow` - Emotion model
- `transformers==5.5.4` - BART translation
- `groq>=0.12.0` - LLM API
- `mediapipe==0.10.13` - Pose detection
- `opencv-python==4.13.0.92` - Image processing

---

*Documentation prepared for FYP Panel Presentation*
*QuiteCare AI Engine - Sign Language & Empathetic Chatbot System*