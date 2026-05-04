import sys
import os
import subprocess
import logging
import warnings
from collections import Counter
import numpy as np

warnings.filterwarnings("ignore")

logger = logging.getLogger("lyrics_service")
logger.setLevel(logging.INFO)

# VAD options for WhisperX
VAD_OPTS = {
    "vad_onset": 0.500,
    "vad_offset": 0.363,
}

# Languages with align model support in WhisperX
SUPPORTED_ALIGN_LANGS = {
    "en", "fr", "de", "es", "it", "ja", "zh", "nl", "uk", "pt",
    "ar", "cs", "ru", "pl", "hu", "fi", "fa", "el", "tr", "da",
    "he", "vi", "ko", "ur", "te", "hi", "ca", "ml", "no", "nn",
    "sk", "sl", "hr", "ro", "eu", "gl", "ka", "lv", "tl",
}

_CACHED_MODELS: dict = {}

def extract_vocals_demucs(audio_path: str, output_dir: str) -> str:
    """Separate vocals using Demucs, return path to vocals.wav."""
    logger.info(f"Running Demucs on {audio_path}...")
    cmd = [
        sys.executable, "-m", "demucs.separate",
        "--two-stems=vocals",
        "-n", "htdemucs",
        "-o", output_dir,
        audio_path,
    ]
    try:
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    except subprocess.CalledProcessError as e:
        stderr = e.stderr.decode() if e.stderr else "Unknown error"
        logger.error(f"Demucs failed: {stderr}")
        raise RuntimeError(f"Demucs processing failed: {stderr}")

    basename = os.path.splitext(os.path.basename(audio_path))[0]
    vocals_path = os.path.join(output_dir, "htdemucs", basename, "vocals.wav")
    if not os.path.exists(vocals_path):
        raise FileNotFoundError(f"Demucs did not output expected vocals file: {vocals_path}")

    logger.info(f"Demucs vocals at: {vocals_path}")
    return vocals_path


def get_whisper_model(model_name: str = "small", device: str = None, compute_type: str = None):
    """Load & cache a WhisperX model."""

    import whisperx
    import torch

    if device is None:
        device = "cuda" if torch.cuda.is_available() else "cpu"
    if compute_type is None:
        compute_type = "float16" if device == "cuda" else "int8"

    key = (model_name, device, compute_type)
    if key not in _CACHED_MODELS:
        logger.info(f"Loading WhisperX model '{model_name}' (device={device})...")
        _CACHED_MODELS[key] = whisperx.load_model(
            model_name, device, compute_type=compute_type, vad_options=VAD_OPTS
        )
    return _CACHED_MODELS[key]


def detect_primary_language(model, audio: np.ndarray, sample_rate: int = 16000):
    """Sample 3 points in audio to estimate dominant language."""
    duration = len(audio) / sample_rate
    if duration < 45:
        return None

    sample_points = [0.10, 0.40, 0.70]
    sample_len = 30 * sample_rate

    detected = []
    for point in sample_points:
        start = int(len(audio) * point)
        chunk = audio[start:start + sample_len]
        if len(chunk) < sample_rate * 5:
            continue
        try:
            lang, prob, *_ = model.model.detect_language(chunk)
            detected.append((lang, prob))
            logger.info(f"Sample at {point*100:.0f}%: {lang} (prob={prob:.2f})")
        except Exception as e:
            logger.warning(f"Language detection at {point} failed: {e}")

    if not detected:
        return None

    counter = Counter(lang for lang, _ in detected)
    most_common_lang, count = counter.most_common(1)[0]
    if count >= 2:
        logger.info(f"Primary language: {most_common_lang} ({count}/{len(detected)})")
        return most_common_lang

    best = max(detected, key=lambda x: x[1])[0]
    logger.info(f"No majority, using highest confidence: {best}")
    return best
