from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class LetterResponse(BaseModel):
    id: int
    title: str
    content: str
    mood: Optional[str] = None
    location: Optional[str] = None
    weather: Optional[str] = None
    tags: Optional[str] = None
    image_url: Optional[str] = None
    favorite: bool
    created_at: datetime
    letter_content: str

    class Config:
        from_attributes = True
