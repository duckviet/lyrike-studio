from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from main import app
from core.utils import sanitize_youtube_url

def test_sanitize_youtube_url_watch():
    url = "https://www.youtube.com/watch?v=OpQFFLBMEPI&list=RDPaKr9gWqwl4&index=2"
    expected = "https://www.youtube.com/watch?v=OpQFFLBMEPI"
    assert sanitize_youtube_url(url) == expected

def test_sanitize_youtube_url_short():
    url = "https://youtu.be/OpQFFLBMEPI?list=RDPaKr9gWqwl4&index=2"
    expected = "https://youtu.be/OpQFFLBMEPI"
    assert sanitize_youtube_url(url) == expected

def test_sanitize_youtube_url_music():
    url = "https://music.youtube.com/watch?v=OpQFFLBMEPI&list=RDPaKr9gWqwl4&index=2&feature=share"
    sanitized = sanitize_youtube_url(url)
    assert "list=" not in sanitized
    assert "index=" not in sanitized
    assert "v=OpQFFLBMEPI" in sanitized

def test_sanitize_youtube_url_non_youtube():
    url = "https://example.com/watch?list=123&v=abc"
    assert sanitize_youtube_url(url) == url

def test_sanitize_youtube_url_no_list():
    url = "https://www.youtube.com/watch?v=OpQFFLBMEPI"
    assert sanitize_youtube_url(url) == url

def test_fetch_endpoint_sanitizes_url():
    client = TestClient(app)
    
    with patch("routes.local_api.fetch_video_info") as mock_fetch_info, \
         patch("routes.local_api.download_audio") as mock_download, \
         patch("routes.local_api.load_metadata", return_value=None) as mock_load_meta, \
         patch("routes.local_api.find_cached_audio", return_value=None) as mock_find_cache, \
         patch("routes.local_api.save_metadata") as mock_save_meta:
             
        mock_fetch_info.return_value = {
            "id": "OpQFFLBMEPI",
            "title": "Test Title",
            "uploader": "Test Uploader",
            "duration": 180
        }
        mock_download.return_value = MagicMock(exists=lambda: True)
        
        response = client.post(
            "/local-api/fetch",
            json={"url": "https://www.youtube.com/watch?v=OpQFFLBMEPI&list=RDPaKr9gWqwl4&index=2"}
        )
        
        mock_fetch_info.assert_called_with("https://www.youtube.com/watch?v=OpQFFLBMEPI")
        mock_download.assert_called_with("https://www.youtube.com/watch?v=OpQFFLBMEPI", "OpQFFLBMEPI")
        
        saved_metadata = mock_save_meta.call_args[0][1]
        assert saved_metadata["sourceUrl"] == "https://www.youtube.com/watch?v=OpQFFLBMEPI"
        
        assert response.status_code == 200
        assert response.json()["videoId"] == "OpQFFLBMEPI"
