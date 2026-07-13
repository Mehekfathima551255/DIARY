from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
import os
import shutil
import uuid
import json

from app.database.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.memory_schema import (
    MemoryCreate,
    MemoryUpdate,
    MemoryResponse
)
from app.services.memory_service import (
    create_memory,
    get_all_memories,
    get_memory_by_id,
    update_memory,
    delete_memory,
    search_memories,
    get_memories_by_mood,
    get_favorite_memories,
    get_memories_by_tag
)
router = APIRouter(
    prefix="/memories",
    tags=["Memories"]
)


# --------------------------------
# SEARCH MEMORIES
# --------------------------------
@router.get("/search", response_model=list[MemoryResponse])
def search(
    q: str = Query(..., description="Search memories"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return search_memories(
        db=db,
        user_id=current_user.id,
        query=q
    )


# --------------------------------
# CREATE MEMORY
# --------------------------------
@router.post("/", response_model=MemoryResponse)
def add_memory(
    memory: MemoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return create_memory(
        db=db,
        user_id=current_user.id,
        title=memory.title,
        content=memory.content,
        mood=memory.mood,
        location=memory.location,
        weather=memory.weather,
        tags=memory.tags,
        favorite=memory.favorite
    )


# --------------------------------
# GET ALL MEMORIES
# --------------------------------
@router.get("/", response_model=list[MemoryResponse])
def get_memories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_all_memories(
        db=db,
        user_id=current_user.id
    )


# --------------------------------
# EXPORT MEMORIES
# --------------------------------
@router.get("/export", response_model=list[MemoryResponse])
def export_memories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # GET /export must be defined before GET /{memory_id} to avoid matching the ID route
    return get_all_memories(
        db=db,
        user_id=current_user.id
    )


# --------------------------------
# IMPORT MEMORIES
# --------------------------------
@router.post("/import")
async def import_memories(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith('.json'):
        raise HTTPException(status_code=400, detail="Only JSON files are supported.")
    
    content = await file.read()
    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON file.")
        
    if not isinstance(data, list):
        raise HTTPException(status_code=400, detail="JSON must contain a list of memories.")
        
    imported_count = 0
    for item in data:
        title = item.get("title", "Imported Memory")
        content_text = item.get("content", "")
        mood = item.get("mood", "Neutral")
        location = item.get("location")
        weather = item.get("weather")
        tags = item.get("tags", "")
        favorite = item.get("favorite", False)
        
        create_memory(
            db=db,
            user_id=current_user.id,
            title=title,
            content=content_text,
            mood=mood,
            location=location,
            weather=weather,
            tags=tags,
            favorite=favorite
        )
        imported_count += 1
        
    return {"message": f"Successfully imported {imported_count} memories."}




# --------------------------------
# GET MEMORY BY ID
# --------------------------------
@router.get("/{memory_id}", response_model=MemoryResponse)
def get_memory(
    memory_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    memory = get_memory_by_id(
        db=db,
        memory_id=memory_id,
        user_id=current_user.id
    )

    if memory is None:
        raise HTTPException(
            status_code=404,
            detail="Memory not found."
        )

    return memory


# --------------------------------
# UPDATE MEMORY
# --------------------------------
@router.put("/{memory_id}", response_model=MemoryResponse)
def edit_memory(
    memory_id: int,
    memory_data: MemoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    memory = get_memory_by_id(
        db=db,
        memory_id=memory_id,
        user_id=current_user.id
    )

    if memory is None:
        raise HTTPException(
            status_code=404,
            detail="Memory not found."
        )

    return update_memory(
        db=db,
        memory=memory,
        title=memory_data.title,
        content=memory_data.content,
        mood=memory_data.mood,
        location=memory_data.location,
        weather=memory_data.weather,
        tags=memory_data.tags,
        favorite=memory_data.favorite
    )


# --------------------------------
# DELETE MEMORY
# --------------------------------
@router.delete("/{memory_id}")
def remove_memory(
    memory_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    memory = get_memory_by_id(
        db=db,
        memory_id=memory_id,
        user_id=current_user.id
    )

    if memory is None:
        raise HTTPException(
            status_code=404,
            detail="Memory not found."
        )

    delete_memory(
        db=db,
        memory=memory
    )

    return {
        "message": "Memory deleted successfully."
    }

@router.get("/filter/mood", response_model=list[MemoryResponse])
def filter_by_mood(
    mood: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_memories_by_mood(
        db=db,
        user_id=current_user.id,
        mood=mood
    )

@router.get("/filter/favorite", response_model=list[MemoryResponse])
def favorite_memories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_favorite_memories(
        db=db,
        user_id=current_user.id
    )

@router.get("/filter/tag", response_model=list[MemoryResponse])
def filter_by_tag(
    tag: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_memories_by_tag(
        db=db,
        user_id=current_user.id,
        tag=tag
    )

# --------------------------------
# UPLOAD IMAGE
# --------------------------------
@router.post("/{memory_id}/image", response_model=MemoryResponse)
def upload_memory_image(
    memory_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    memory = get_memory_by_id(
        db=db,
        memory_id=memory_id,
        user_id=current_user.id
    )

    if memory is None:
        raise HTTPException(
            status_code=404,
            detail="Memory not found."
        )

    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")

    # Create a unique filename
    file_extension = file.filename.split('.')[-1]
    new_filename = f"{uuid.uuid4()}.{file_extension}"
    upload_path = os.path.join("uploads", new_filename)

    # Ensure uploads directory exists
    os.makedirs("uploads", exist_ok=True)

    # Save file
    with open(upload_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Update database
    memory.image_url = f"/uploads/{new_filename}"
    db.commit()
    db.refresh(memory)

    return memory


# --------------------------------
# UPLOAD AUDIO
# --------------------------------
@router.post("/{memory_id}/audio", response_model=MemoryResponse)
def upload_memory_audio(
    memory_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    memory = get_memory_by_id(
        db=db,
        memory_id=memory_id,
        user_id=current_user.id
    )

    if memory is None:
        raise HTTPException(status_code=404, detail="Memory not found.")

    allowed_audio = {"audio/webm", "audio/ogg", "audio/wav", "audio/mpeg", "audio/mp4"}
    if file.content_type not in allowed_audio and not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="File provided is not an audio file.")

    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "webm"
    new_filename = f"{uuid.uuid4()}.{ext}"
    upload_path = os.path.join("uploads", new_filename)

    os.makedirs("uploads", exist_ok=True)

    with open(upload_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    memory.audio_url = f"/uploads/{new_filename}"
    db.commit()
    db.refresh(memory)

    return memory
