import json
import logging

from openai import AsyncOpenAI
from core.config import OPENAI_API_KEY

logger = logging.getLogger("lyrics_refinement")

_client = AsyncOpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

SYSTEM_PROMPT = """You are a careful post-processor for ASR-generated song lyrics.

Processing priorities, in order:
1. Fix clear recognition errors.
2. Fix basic spelling and punctuation issues.
3. Split lines in a readable way.
4. Preserve timestamps as much as possible. Use format [mm:ss.xx] (e.g., [00:12.34]).
5. Keep plainLyrics and syncedLyrics consistent in content.

Rules:
- If unsure whether a word or line is correct, keep it unchanged.
- Do not use outside knowledge to replace the lyrics.
- Do not add new content.
- Do not add structure tags unless clearly supported by the input.
- Do not remove square brackets from timestamps.

Return valid JSON with exactly two fields: "syncedLyrics" and "plainLyrics"."""


async def refine_lyrics_with_ai(
    synced_lyrics: str,
    plain_lyrics: str,
    track_name: str = "",
    artist_name: str = "",
    duration: float = 0,
) -> dict:
    """Use OpenAI to improve ASR-generated lyrics."""
    if not _client:
        return {
            "syncedLyrics": synced_lyrics,
            "plainLyrics": plain_lyrics,
            "is_ai_refined": False,
            "model": None,
        }

    user_prompt = (
        f"Song information:\n"
        f"- Title: {track_name}\n"
        f"- Artist: {artist_name}\n"
        f"- Duration: {duration}s\n\n"
        f"SYNCED LYRICS (RAW):\n{synced_lyrics}\n\n"
        f"PLAIN LYRICS (RAW):\n{plain_lyrics}"
    )

    try:
        response = await _client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
            max_tokens=4000,
            response_format={"type": "json_object"},
        )
        result = json.loads(response.choices[0].message.content)

        return {
            "syncedLyrics": result.get("syncedLyrics", synced_lyrics),
            "plainLyrics": result.get("plainLyrics", plain_lyrics),
            "is_ai_refined": True,
            "model": "gpt-4o-mini",
        }

    except Exception as e:
        logger.error(f"OpenAI refinement failed: {e}")
        return {
            "syncedLyrics": synced_lyrics,
            "plainLyrics": plain_lyrics,
            "is_ai_refined": False,
            "model": None,
            "error": str(e),
        }