import json
from unittest.mock import patch

from fastapi.testclient import TestClient

from main import app


def test_peaks_endpoint_saves_generated_peaks_to_peaks_cache(tmp_path):
    video_id = "dQw4w9WgXcQ"
    safe_video_id = "dQw4w9WgXcQ"
    peaks_root = tmp_path / "peaks"
    media_root = tmp_path / "media"
    audio_file = media_root / f"{safe_video_id}.m4a"
    audio_file.parent.mkdir(parents=True)
    audio_file.write_bytes(b"fake audio")

    with (
        patch("routes.local_api.normalize_video_id", return_value=safe_video_id),
        patch(
            "routes.local_api.load_metadata",
            return_value={"duration": 212, "title": "Fixture"},
        ),
        patch("routes.local_api.find_cached_audio", return_value=audio_file),
        patch("routes.local_api.compute_peaks", return_value=[0.0, 0.25, -0.1]),
        patch("services.metadata_service.PEAKS_CACHE_DIR", peaks_root),
    ):
        response = TestClient(app).get(f"/local-api/peaks/{video_id}")

    assert response.status_code == 200
    payload = response.json()
    assert payload["cacheHit"] is False
    assert payload["peaks"] == [0.0, 0.25, -0.1]

    peaks_file = peaks_root / safe_video_id / "original.json"
    assert peaks_file.exists()
    saved = json.loads(peaks_file.read_text())
    assert saved["peaks"] == [0.0, 0.25, -0.1]
    assert saved["source"] == "original"

    metadata_file = media_root / f"{safe_video_id}.json"
    assert not metadata_file.exists()
