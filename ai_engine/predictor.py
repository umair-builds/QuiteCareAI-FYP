import os
import cv2
import numpy as np
import torch
import torch.nn as nn
import mediapipe as mp
from collections import deque, Counter

# --- PATHS ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")
MODEL_PATH = os.path.join(MODELS_DIR, "final_model_all1.pth")
MEAN_STD_PATH = os.path.join(MODELS_DIR, "mean_std.npz")
LABELS_PATH = os.path.join(MODELS_DIR, "labels.txt")

# --- CONFIG ---
EXPECTED_KEYPOINTS = 1662
SEQUENCE_LENGTH = 50
MOTION_INPUT_DIM = EXPECTED_KEYPOINTS * 2
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# --- TUNING ---
# We use fixed thresholds to ensure it responds INSTANTLY (no waiting 3s)
START_TH_FIXED = 0.02
END_TH_FIXED = 0.01
END_STABILITY_FRAMES = 8
PREDICTION_RATE = 5
PREDICTION_QUEUE_LENGTH = 15
MAJORITY_VOTE_THRESHOLD = 0.5 
REQUIRE_HAND = True          # Strict check (reduces noise)

class TransformerClassifier(nn.Module):
    def __init__(self, input_dim=MOTION_INPUT_DIM, num_classes=50, d_model=256, nhead=4, num_layers=2, dropout=0.4):
        super().__init__()
        self.input_fc = nn.Linear(input_dim, d_model)
        encoder_layer = nn.TransformerEncoderLayer(d_model=d_model, nhead=nhead, batch_first=True, dropout=dropout)
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)
        self.cls_fc = nn.Linear(d_model, num_classes)
        self.bn1 = nn.BatchNorm1d(d_model)
        self.bn2 = nn.BatchNorm1d(d_model)

    def forward(self, x):
        x = self.input_fc(x)
        x = self.bn1(x.permute(0, 2, 1)).permute(0, 2, 1)
        x = self.transformer(x)
        x = self.bn2(x.mean(dim=1))
        return self.cls_fc(x)

class SignPredictor:
    def __init__(self):
        print("Loading Sign Predictor (Anti-Lag Optimized)...")
        self.holistic = mp.solutions.holistic.Holistic(
            min_detection_confidence=0.5, 
            min_tracking_confidence=0.5,
            model_complexity=1
        )
        self.labels = self.load_labels()
        self.model = self.load_model()
        self.mean, self.std = self.load_stats()
        
        self.sequence_buffer = deque(maxlen=SEQUENCE_LENGTH)
        self.prediction_queue = deque(maxlen=PREDICTION_QUEUE_LENGTH)
        
        self.state = "IDLE"
        self.last_norm_kp = None
        self.end_counter = 0
        self.frame_counter = 0
        self.last_confirmed_word = None
        
        print(f"Sign Predictor Ready. Device: {DEVICE}")

    def load_labels(self):
        with open(LABELS_PATH, 'r', encoding='utf-8') as f:
            return [l.strip() for l in f if l.strip()]

    def load_stats(self):
        if os.path.exists(MEAN_STD_PATH):
            arr = np.load(MEAN_STD_PATH)
            return arr.get('mean'), arr.get('std')
        return None, None

    def load_model(self):
        num_classes = len(self.labels)
        model = TransformerClassifier(num_classes=num_classes).to(DEVICE)
        ckpt = torch.load(MODEL_PATH, map_location=DEVICE)
        if isinstance(ckpt, dict) and 'model_state' in ckpt:
            model.load_state_dict(ckpt['model_state'])
        else:
            model.load_state_dict(ckpt)
        model.eval()
        return model

    def extract_keypoints(self, results):
        if results.pose_landmarks:
            pose = np.array([[lm.x, lm.y, lm.z, lm.visibility] for lm in results.pose_landmarks.landmark], dtype=np.float32).flatten()
        else:
            pose = np.zeros(33 * 4, dtype=np.float32)
        if results.face_landmarks:
            face = np.array([[lm.x, lm.y, lm.z] for lm in results.face_landmarks.landmark], dtype=np.float32).flatten()
        else:
            face = np.zeros(468 * 3, dtype=np.float32)
        if results.left_hand_landmarks:
            lh = np.array([[lm.x, lm.y, lm.z] for lm in results.left_hand_landmarks.landmark], dtype=np.float32).flatten()
        else:
            lh = np.zeros(21 * 3, dtype=np.float32)
        if results.right_hand_landmarks:
            rh = np.array([[lm.x, lm.y, lm.z] for lm in results.right_hand_landmarks.landmark], dtype=np.float32).flatten()
        else:
            rh = np.zeros(21 * 3, dtype=np.float32)
        return np.concatenate([pose, face, lh, rh]).astype(np.float32)

    def process_frame(self, image_bytes):
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        frame = cv2.flip(frame, 1) 
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        results = self.holistic.process(rgb)
        kp = self.extract_keypoints(results)
        self.frame_counter += 1

        if self.mean is not None:
            norm_kp = (kp - self.mean) / (self.std + 1e-8)
        else:
            norm_kp = kp.copy()

        # --- MOVEMENT CALCULATION (WITH SPEED CORRECTION) ---
        if self.last_norm_kp is None:
            movement = 0.0
            velocity = np.zeros_like(norm_kp)
        else:
            movement = float(np.sum(np.abs(norm_kp - self.last_norm_kp)))
            
            # [CRITICAL FIX] 
            # We divide by 3.0 because the web sends frames slower than 30fps.
            # This makes the "speed" look normal to the AI.
            velocity = (norm_kp - self.last_norm_kp) / 3.0 
            
        self.last_norm_kp = norm_kp.copy()

        # Buffer
        frame_input = np.concatenate([norm_kp, velocity]).astype(np.float32)
        self.sequence_buffer.append(frame_input)

        # Hand Check
        LH_START = (33 * 4) + (468 * 3)
        LH_END = LH_START + (21 * 3)
        RH_START = LH_END
        RH_END = RH_START + (21 * 3)
        is_hand_present = (np.sum(np.abs(norm_kp[LH_START:LH_END])) > 0) or \
                          (np.sum(np.abs(norm_kp[RH_START:RH_END])) > 0)

        # --- STATE MACHINE ---
        if self.state == "IDLE":
            # Check threshold (START_TH_FIXED = 0.02)
            if (movement > START_TH_FIXED) and ((not REQUIRE_HAND) or is_hand_present):
                self.state = "RECORDING"
                self.prediction_queue.clear()
                self.last_confirmed_word = None 
                print(f"Started Recording (Mov: {movement:.3f})")

        if self.state == "RECORDING":
            if movement < END_TH_FIXED:
                self.end_counter += 1
            else:
                self.end_counter = 0
            
            if self.end_counter >= END_STABILITY_FRAMES:
                self.state = "IDLE"
                print("Stopped Recording.")

        # --- PREDICTION ---
        final_prediction = None
        is_prediction_time = (len(self.sequence_buffer) == SEQUENCE_LENGTH and 
                              self.frame_counter % PREDICTION_RATE == 0)

        if self.state == "RECORDING" and is_prediction_time:
            if is_hand_present or not REQUIRE_HAND:
                inp = np.array(self.sequence_buffer, dtype=np.float32)
                inp = np.expand_dims(inp, axis=0)
                tensor = torch.tensor(inp, dtype=torch.float32).to(DEVICE)
                
                with torch.no_grad():
                    logits = self.model(tensor)
                    probs = torch.softmax(logits, dim=1)
                    conf, idx = probs.max(1)
                    pred_word = self.labels[idx.item()]
                    conf_val = float(conf.item())

                self.prediction_queue.append(pred_word)
                counts = Counter(self.prediction_queue)
                stable_pred, stable_count = counts.most_common(1)[0]
                
                needed_count = max(1, int(PREDICTION_QUEUE_LENGTH * MAJORITY_VOTE_THRESHOLD))
                if stable_count >= needed_count:
                    if stable_pred != self.last_confirmed_word:
                        self.last_confirmed_word = stable_pred
                        final_prediction = stable_pred
                        print(f"PREDICTED: {stable_pred} ({conf_val:.2f})")
                        self.prediction_queue.clear() 
            else:
                 self.prediction_queue.clear()

        return final_prediction