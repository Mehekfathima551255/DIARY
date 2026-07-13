from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.memory import Memory


def create_memory(
    db: Session,
    user_id: int,
    title: str,
    content: str,
    mood: str = None,
    location: str = None,
    weather: str = None,
    tags: str = None,
    favorite: bool = False
):
    memory = Memory(
        title=title,
        content=content,
        mood=mood,
        location=location,
        weather=weather,
        tags=tags,
        favorite=favorite,
        user_id=user_id
    )

    db.add(memory)
    db.commit()
    db.refresh(memory)

    return memory


def get_all_memories(
    db: Session,
    user_id: int
):
    return (
        db.query(Memory)
        .filter(Memory.user_id == user_id)
        .order_by(Memory.created_at.desc())
        .all()
    )


def get_memory_by_id(
    db: Session,
    memory_id: int,
    user_id: int
):
    return (
        db.query(Memory)
        .filter(
            Memory.id == memory_id,
            Memory.user_id == user_id
        )
        .first()
    )


def update_memory(
    db: Session,
    memory: Memory,
    title: str,
    content: str,
    mood: str = None,
    location: str = None,
    weather: str = None,
    tags: str = None,
    favorite: bool = False
):
    memory.title = title
    memory.content = content
    memory.mood = mood
    memory.location = location
    memory.weather = weather
    memory.tags = tags
    memory.favorite = favorite

    db.commit()
    db.refresh(memory)

    return memory


def delete_memory(
    db: Session,
    memory: Memory
):
    db.delete(memory)
    db.commit()


def search_memories(
    db: Session,
    user_id: int,
    query: str
):
    return (
        db.query(Memory)
        .filter(
            Memory.user_id == user_id,
            or_(
                Memory.title.ilike(f"%{query}%"),
                Memory.content.ilike(f"%{query}%"),
                Memory.tags.ilike(f"%{query}%")
            )
        )
        .order_by(Memory.created_at.desc())
        .all()
    )

def get_memories_by_mood(
    db: Session,
    user_id: int,
    mood: str
):
    return (
        db.query(Memory)
        .filter(
            Memory.user_id == user_id,
            Memory.mood == mood
        )
        .order_by(Memory.created_at.desc())
        .all()
    )

def get_favorite_memories(
    db: Session,
    user_id: int
):
    return (
        db.query(Memory)
        .filter(
            Memory.user_id == user_id,
            Memory.favorite == True
        )
        .order_by(Memory.created_at.desc())
        .all()
    )

def get_memories_by_tag(
    db: Session,
    user_id: int,
    tag: str
):
    return (
        db.query(Memory)
        .filter(
            Memory.user_id == user_id,
            Memory.tags.ilike(f"%{tag}%")
        )
        .order_by(Memory.created_at.desc())
        .all()
    )