import os
import cv2
import json
import zipfile
import tempfile
import numpy as np

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
EMOTION_MODEL_PATH = os.path.join(BASE_DIR, "models", "fer_best_model_v2_diverse.keras")


# ---------------------------------------------------------------------------
# Config patcher — fixes Keras 3.x → 2.x serialisation differences
# ---------------------------------------------------------------------------
def _patch_config(obj):
    """
    Recursively walk a deserialized Keras config and fix two mismatches:

    1.  DTypePolicy dict  → plain string  (Keras 3.x saves dtype as a
        {'class_name': 'DTypePolicy', 'config': {'name': 'float32'}} dict;
        Keras 2.x __init__ expects a plain string like 'float32')

    2.  batch_shape → input_shape  (InputLayer key renamed across versions)
    """
    if isinstance(obj, dict):
        # Fix 1: DTypePolicy dict → plain name string
        if obj.get("class_name") == "DTypePolicy" and "config" in obj:
            return obj["config"].get("name", "float32")
        result = {}
        for k, v in obj.items():
            if k == "batch_shape":
                # Fix 2: drop batch dim (None) and use input_shape instead
                result["input_shape"] = tuple(v[1:]) if v else ()
            else:
                result[k] = _patch_config(v)
        return result
    if isinstance(obj, list):
        return [_patch_config(i) for i in obj]
    return obj


# ---------------------------------------------------------------------------
# Runtime patch — get_policy crashes when passed a plain string
# ---------------------------------------------------------------------------
def _apply_runtime_patches():
    """
    Keras 2.x's get_policy() at line 485 does:
        dtype_policy.name == "mixed_float16"
    If dtype is already a plain string (e.g. 'float32') that line crashes with
    AttributeError: 'str' object has no attribute 'name'.
    We patch it to wrap strings in a proper Policy object first.
    """
    try:
        from keras.src.mixed_precision import policy as _kpol
        _orig = _kpol.get_policy

        def _safe_get_policy(dtype):
            if isinstance(dtype, str):
                return _kpol.Policy(dtype)
            return _orig(dtype)

        _kpol.get_policy = _safe_get_policy
    except Exception:
        pass  # If the module path differs, skip — worst case original error shows


# ---------------------------------------------------------------------------
# Model loader — treats .keras as a ZIP, patches config, loads weights
# ---------------------------------------------------------------------------
def _load_model_compat(path: str):
    """
    Load a .keras file regardless of which Keras version saved it.

    The .keras format (Keras 2.12+) is a ZIP archive containing:
        config.json       — model architecture
        *.h5 / *.weights.h5  — serialised weights
        metadata.json     — version info

    By reading, patching, and re-serialising the config ourselves we
    avoid every deserialization incompatibility in one shot.
    """
    import tensorflow as tf

    _apply_runtime_patches()

    try:
        with zipfile.ZipFile(path, "r") as zf:
            names = zf.namelist()

            # Read and patch config
            raw = json.loads(zf.read("config.json"))
            patched = _patch_config(raw)

            # Reconstruct model architecture
            model = tf.keras.models.model_from_json(json.dumps(patched))

            # Find the weights file (various possible names)
            weight_file = next(
                (n for n in names if n.endswith(".h5")), None
            )
            if weight_file:
                with tempfile.TemporaryDirectory() as tmp:
                    zf.extract(weight_file, tmp)
                    model.load_weights(os.path.join(tmp, weight_file))

            return model

    except Exception as e:
        print(f"[EmotionDetector] ZIP strategy failed ({e}), falling back to direct load...")
        _apply_runtime_patches()
        return tf.keras.models.load_model(path, compile=False)


# ---------------------------------------------------------------------------
# Public class
# ---------------------------------------------------------------------------
class EmotionDetector:
    """
    Wraps the FER Keras model and exposes predict_emotion().

    Pre-processing pipeline (matches live_test.py / training):
        BGR frame → grayscale → padded crop → CLAHE → 112x112 INTER_CUBIC
        → /255 → shape (1,112,112,1) → model.predict
    """

    EMOTION_LABELS = ["Angry", "Disgust", "Fear", "Happy", "Neutral", "Sad", "Surprise"]

    def __init__(self):
        print("[EmotionDetector] Loading FER model (cross-version compat)...")
        self.model = _load_model_compat(EMOTION_MODEL_PATH)
        self.clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        print(f"[EmotionDetector] Ready. Input shape: {self.model.input_shape}")

    def predict_emotion(self, frame: np.ndarray, face_bounding_box: tuple) -> str:
        x, y, w, h = face_bounding_box

        # 30-pixel padding to capture eyebrows
        pad = 30
        h_img, w_img = frame.shape[:2]
        y1 = max(0, y - pad)
        y2 = min(h_img, y + h + pad)
        x1 = max(0, x - pad)
        x2 = min(w_img, x + w + pad)

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        roi = gray[y1:y2, x1:x2]

        if roi.size == 0:
            return "Neutral"

        img = self.clahe.apply(roi)
        img = cv2.resize(img, (112, 112), interpolation=cv2.INTER_CUBIC)
        img = img.astype("float32") / 255.0
        img = np.reshape(img, (1, 112, 112, 1))

        preds = self.model.predict(img, verbose=0)[0]
        return self.EMOTION_LABELS[int(np.argmax(preds))]
