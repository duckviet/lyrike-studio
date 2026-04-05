import sys
import json
import os
import argparse
import tempfile
import logging
import warnings
import subprocess
import yt_dlp
import whisperx
import torch

warnings.filterwarnings("ignore")


MAX_DURATION = 5 
MAX_WORDS = 12   


vad_opts = {
    "vad_onset": 0.500,    # Ngưỡng bắt đầu giọng nói (mặc định ~0.5)
    "vad_offset": 0.363    # Ngưỡng kết thúc giọng nói (tăng/giảm để cắt câu nhanh hơn)
}

# Configure basic logging
logger = logging.getLogger("lyrics_extractor")
logger.setLevel(logging.INFO)
ch = logging.StreamHandler()
ch.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s', datefmt='%H:%M:%S'))
if not logger.handlers:
    logger.addHandler(ch)

def format_time_lrc(seconds):
    """Convert seconds to [mm:ss.xx] format for LRC."""
    m = int(seconds // 60)
    s = seconds % 60
    return f"[{m:02d}:{s:05.2f}]"

def extract_metadata_and_audio(url, output_path):
    logger.info(f"Downloading audio from {url}...")
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': output_path,
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'wav',
            'preferredquality': '192',
        }],
        'quiet': True,
        'no_warnings': True,
        'noplaylist': True,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info_dict = ydl.extract_info(url, download=True)
        dur = info_dict.get('duration', 0)
        title = info_dict.get('title', '')
        logger.info(f"Download complete: {title} ({dur}s)")
        return {
            "title": title,
            "uploader": info_dict.get('uploader', ''),
            "duration": dur
        }

def group_words_into_lines(segments, max_gap=2.0, max_duration=10.0):
    all_words = []
    for seg in segments:
        words = seg.get("words", [])
        for w in words:
            if "start" in w and "end" in w and w.get("word", "").strip():
                all_words.append(w)

    if not all_words:
        lines = []
        for seg in segments:
            text = seg.get("text", "").strip()
            if text:
                lines.append((seg.get("start", 0), text))
        return lines

    lines = []
    current_words = [all_words[0]]
    line_start = all_words[0]["start"]

    for i in range(1, len(all_words)):
        prev = all_words[i - 1]
        curr = all_words[i]

        gap = curr["start"] - prev["end"]
        duration = curr["end"] - line_start

        word_text = curr["word"].strip()
        clean_word = "".join(c for c in word_text if c.isalpha() or c == "'")
        
        is_capitalized = len(clean_word) > 0 and clean_word[0].isupper()
        is_pronoun_i = clean_word in ["I", "I'm", "I've", "I'll", "I'd"]
        
        prev_text = prev["word"].strip()
        
        # Bổ sung dấu phẩy (,) vào danh sách ép buộc xuống dòng
        ends_with_punctuation = prev_text.endswith(('.', '!', '?', ',', ';', ':'))

        should_split = False

        # Tách nếu gap quá dài hoặc dòng quá dài
        if gap > max_gap or duration > max_duration:
            should_split = True
        # Tách nếu từ trước CÓ DẤU CÂU (chấm, phẩy...)
        elif ends_with_punctuation:
            should_split = True
        # Tách nếu từ mới viết hoa
        elif is_capitalized:
            if is_pronoun_i:
                # Đối với đại từ "I", chỉ cần gap > 0.25s là tách để tránh dính chữ
                # (hoặc nó đã tự tách nếu có dấu câu ở trên rồi)
                if gap > 0.25:
                    should_split = True
            else:
                should_split = True

        if should_split:
            text = " ".join(w["word"].strip() for w in current_words)
            lines.append((line_start, text))
            current_words = [curr]
            line_start = curr["start"]
        else:
            current_words.append(curr)

    # Dòng cuối cùng
    if current_words:
        text = " ".join(w["word"].strip() for w in current_words)
        lines.append((line_start, text))

    return lines
    
def extract_vocals_demucs(audio_path, output_dir):
    logger.info(f"Running Demucs source separation on {audio_path}...")
    cmd = [
        sys.executable, "-m", "demucs.separate",
        "--two-stems=vocals",
        "-n", "htdemucs",
        "-o", output_dir,
        audio_path
    ]
    try:
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)
    except subprocess.CalledProcessError as e:
        logger.error(f"Demucs failed: {e}")
        raise

    audio_basename = os.path.splitext(os.path.basename(audio_path))[0]
    vocals_path = os.path.join(output_dir, "htdemucs", audio_basename, "vocals.wav")
    
    if os.path.exists(vocals_path):
        logger.info(f"Demucs processing complete. Vocals saved to: {vocals_path}")
        return vocals_path
    else:
        raise FileNotFoundError(f"Demucs failed to output vocals file at expected path: {vocals_path}")


def process_audio(audio_path):
    device = "cuda" if torch.cuda.is_available() else "cpu"
    compute_type = "float16" if device == "cuda" else "int8"
    logger.info(
        f"Loading WhisperX main model "
        f"(Device: {device}, Precision: {compute_type})..."
    )

    # asr_opts = {
    #     "beam_size": 5,
    #     "initial_prompt": "Lyrics of a song, with proper punctuation, commas, and line breaks:"
    # }

    # Load model với cả vad_options và asr_options
    model = whisperx.load_model(
        "small", 
        device, 
        compute_type=compute_type, 
        vad_options=vad_opts,
        # asr_options=asr_opts
    )
  

    logger.info("Starting transcription...")
    audio = whisperx.load_audio(audio_path)
    result = model.transcribe(
        audio, batch_size=4 if device == "cuda" else 1
    )

    logger.info(
        f"Transcription complete. "
        f"Language detected: {result.get('language', 'unknown')}. "
        f"Starting forced word alignment..."
    )

    # 2. Align
    try:
        model_a, metadata = whisperx.load_align_model(
            language_code=result["language"], device=device
        )
        result = whisperx.align(
            result["segments"],
            model_a,
            metadata,
            audio,
            device,
            return_char_alignments=False,
        )
        logger.info("Word alignment complete.")
    except Exception as e:
        logger.warning(
            f"Alignment failed: {str(e)}. "
            f"Falling back to unaligned segments."
        )

    # 3. Regroup words into short lyric lines based on capitalization
    lines = group_words_into_lines(
        result["segments"],
        max_gap=2.0,      # tách dòng nếu gap kéo dài > 2.0s
        max_duration=15.0 # tách dòng nếu dài vượt qua 15s
    )

    synced_lyrics = []
    plain_lyrics = []

    for start_time, text in lines:
        synced_lyrics.append(f"{format_time_lrc(start_time)} {text}")
        plain_lyrics.append(text)

    logger.info(
        f"Successfully formatted lyrics "
        f"({len(lines)} lines)."
    )
    return "\n".join(synced_lyrics), "\n".join(plain_lyrics)

def run_extraction(url: str):
    logger.info("--- Starting Extraction Job ---")
    with tempfile.TemporaryDirectory() as tmpdir:
        raw_audio_path = os.path.join(tmpdir, "audio")
        final_audio_path = os.path.join(tmpdir, "audio.wav")
        demucs_out_dir = os.path.join(tmpdir, "demucs_output")
        
        metadata = extract_metadata_and_audio(url, raw_audio_path)
        
        # 1. Tách nhạc dùng demucs
        vocals_path = extract_vocals_demucs(final_audio_path, demucs_out_dir)
        
        # 2. Xử lý dùng whisperx
        synced, plain = process_audio(vocals_path)
            
        output = {
            "trackName": metadata["title"],
            "artistName": metadata["uploader"],
            "duration": metadata["duration"],
            "syncedLyrics": synced,
            "plainLyrics": plain
        }
        logger.info("--- Extraction Job Finished ---")
        return output

def main():
    parser = argparse.ArgumentParser(description="Extract lyrics from YouTube using WhisperX")
    parser.add_argument("url", help="YouTube URL")
    args = parser.parse_args()

    try:
        output = run_extraction(args.url)
        print(json.dumps(output))
    except Exception as e:
        logger.error(f"Failed: {str(e)}")
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
