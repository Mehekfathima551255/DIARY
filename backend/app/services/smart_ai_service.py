from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from collections import Counter

from app.models.memory import Memory
from app.ai.gemini_service import (
    generate_weekly_reflection,
    generate_monthly_reflection,
    generate_mood_analysis,
    generate_habit_detection,
    generate_productivity_insights,
    generate_ai_suggestion,
    generate_companion_message
)
from app.services.dashboard_service import get_writing_streak, get_top_tags

def get_weekly_reflection(db: Session, user_id: int) -> str:
    week_ago = datetime.utcnow() - timedelta(days=7)
    memories = db.query(Memory).filter(Memory.user_id == user_id, Memory.created_at >= week_ago).all()
    
    if not memories:
        return "You haven't written any memories this week. Start writing to get a weekly reflection!"
        
    memories_text = "\n\n".join([f"Date: {m.created_at.date()}\nContent: {m.content}" for m in memories])
    # Basic truncation to avoid exceeding token limits for very large diaries
    memories_text = memories_text[:10000] 
    
    return generate_weekly_reflection(memories_text)

def get_monthly_reflection(db: Session, user_id: int) -> str:
    month_ago = datetime.utcnow() - timedelta(days=30)
    memories = db.query(Memory).filter(Memory.user_id == user_id, Memory.created_at >= month_ago).all()
    
    if not memories:
        return "You haven't written any memories this month. Start writing to get a monthly reflection!"
        
    memories_text = "\n\n".join([f"Date: {m.created_at.date()}\nContent: {m.content}" for m in memories])
    memories_text = memories_text[:20000] 
    
    return generate_monthly_reflection(memories_text)

def get_mood_analysis(db: Session, user_id: int) -> str:
    month_ago = datetime.utcnow() - timedelta(days=30)
    memories = db.query(Memory).filter(Memory.user_id == user_id, Memory.created_at >= month_ago).all()
    
    if not memories:
        return "Not enough data for mood analysis this month."
        
    moods_text = "\n".join([f"Date: {m.created_at.date()}, Mood: {m.mood or 'Unknown'}" for m in memories])
    
    return generate_mood_analysis(moods_text)

def get_habit_detection(db: Session, user_id: int) -> str:
    memories = db.query(Memory).filter(Memory.user_id == user_id).order_by(Memory.created_at.desc()).limit(30).all()
    
    if not memories:
        return "You haven't established a writing habit yet."
        
    timestamps_text = "\n".join([str(m.created_at) for m in memories])
    
    return generate_habit_detection(timestamps_text)

def get_productivity_insights(db: Session, user_id: int) -> str:
    memories = db.query(Memory).filter(Memory.user_id == user_id).all()
    
    if not memories:
        return "Not enough data for productivity insights."
        
    day_counts = Counter([m.created_at.strftime("%A") for m in memories])
    data_text = "\n".join([f"{day}: {count} entries" for day, count in day_counts.items()])
    
    return generate_productivity_insights(data_text)

def get_ai_suggestions(db: Session, user_id: int) -> str:
    last_memory = db.query(Memory).filter(Memory.user_id == user_id).order_by(Memory.created_at.desc()).first()
    
    days_since_last = 0
    if last_memory:
        days_since_last = (datetime.utcnow() - last_memory.created_at).days
        
    streak_data = get_writing_streak(db, user_id)
    longest_streak = streak_data.get("longest_streak", 0)
    
    top_tags = get_top_tags(db, user_id)
    top_tag = top_tags[0]["tag"] if top_tags else "None"
    
    return generate_ai_suggestion(days_since_last, longest_streak, top_tag)

def get_companion_message(db: Session, user_id: int) -> str:
    """Generate a single thoughtful companion sentence based on recent journal activity."""
    last_memories = db.query(Memory).filter(Memory.user_id == user_id).order_by(Memory.created_at.desc()).limit(3).all()

    if not last_memories:
        return "Your journal is waiting — the first word is the hardest."

    now = datetime.utcnow()
    last = last_memories[0]
    days_ago = (now - last.created_at).days

    context_parts = []
    if days_ago == 0:
        context_parts.append("The user wrote today.")
    elif days_ago == 1:
        context_parts.append("The user wrote yesterday.")
    else:
        context_parts.append(f"The user hasn't written in {days_ago} days.")

    for m in last_memories:
        snippet = (m.content or '').replace('<', '').replace('>', '')[:120]
        context_parts.append(f"- [{m.created_at.strftime('%b %d')}] \"{m.title}\": {snippet}")

    context = "\n".join(context_parts)
    return generate_companion_message(context)
