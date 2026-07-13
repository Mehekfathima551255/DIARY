from datetime import datetime
from pydantic import BaseModel


class MemoryCreate(BaseModel):
    title: str
    content: str
    mood: str | None = None
    location: str | None = None
    weather: str | None = None
    tags: str | None = None
    image_url: str | None = None
    favorite: bool = False


class MemoryUpdate(BaseModel):
    title: str
    content: str
    mood: str | None = None
    location: str | None = None
    weather: str | None = None
    tags: str | None = None
    image_url: str | None = None
    favorite: bool = False


class MemoryResponse(BaseModel):
    id: int
    title: str
    content: str
    mood: str | None
    location: str | None
    weather: str | None
    tags: str | None
    image_url: str | None = None
    favorite: bool
    created_at: datetime
    updated_at: datetime
    user_id: int

    class Config:
        from_attributes = True