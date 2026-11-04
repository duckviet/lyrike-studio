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
- Do not remove square brackets from timestamps.

Transcription style (Musixmatch guidelines):
- Only vocal content belongs in the lyrics. Never add structure or artist labels
  (e.g. "Verse", "Chorus", "(Verse - Artist)"), tags like #INSTRUMENTAL,
  sound effects or descriptions (e.g. "*dial tone*").
- Never use multipliers like "(x5)" or "[Repeat]". Keep every repeated line written out.
- Keep backing vocals, ad-libs, producer tags and live interjections that are in the input.
- Keep fillers and vocalizations (uh, yeah, ooh-ooh-ooh) when they appear, but do not invent or lengthen them.
- Never censor profanity (no "****"). Keep words exactly as delivered; if the input shows a cut-off word, write it with a hyphen (e.g. "f-").
- Keep the original script of each language. Do not romanize or transliterate.

Formatting (Musixmatch guidelines):
- In plainLyrics, separate song sections with one empty line; keep each section to at most 10 lines.
  In syncedLyrics, never add or drop timestamped lines just for section breaks.
- Capitalize the first letter of every line, proper nouns, and the word after "?" or "!".
  Do not capitalize otherwise, and never use ALL CAPS for emphasis.
- Backing vocals go in parentheses and follow the same capitalization rules,
  e.g. "I'm falling (falling)", not "(Falling)" unless it starts a sentence.
- Numbers: write zero to ten as words, above ten as digits ("I got 99 problems", "But not one").
  Use digits for years, decades ('60s), phone numbers and exact times (4:32, 9 a.m.); "eleven o'clock" stays in words.
- Never end a line with a comma or a full stop (acronyms like "a.m." are fine).
  "?" and "!" are fine in moderation. A hyphen or ellipsis may end a line only for interruptions (oka-) or fade-outs (…).
- Standard slang spellings: ballin', 'cause (because), cuz (cousin), 'em, gon'/gonna, I'ma, outta, 'til, yo (greeting), yo' (your).
- Direct speech: comma, then quotes, capitalized first letter: She said, "Do it like this".

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
            max_tokens=16000,  # gpt-4o-mini output cap is 16384
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