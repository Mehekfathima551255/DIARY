from pydantic import BaseModel
from typing import List

class DiaryContent(BaseModel):
    content: str

class AIResponse(BaseModel):
    result: str

class AITagsResponse(BaseModel):
    tags: List[str]

class AIMoodResponse(BaseModel):
    mood: str
