from typing import Optional
from pydantic import BaseModel

class ExtractRequest(BaseModel):
    url: str
    enableRefinement: bool = True

class FetchRequest(BaseModel):
    url: Optional[str] = None
    videoId: Optional[str] = None

class TranscribeRequest(BaseModel):
    videoId: str
    force: bool = False
    enableRefinement: bool = True
