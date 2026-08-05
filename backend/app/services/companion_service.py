from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import json
import re
import logging
from app.models.memory import Memory
from app.models.user import User
from app.ai.gemini_service import generate_companion_greeting, generate_weekly_letter

logger = logging.getLogger(__name__)

def clean_json_text(text: str) -> str:
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip(), flags=re.IGNORECASE)
    return cleaned.strip()

def get_companion_greeting(db: Session, user_id: int) -> str:
    today_str = datetime.utcnow().strftime("%A, %B %d, %Y")
    
    # Fetch user's memories
    memories = db.query(Memory).filter(Memory.user_id == user_id).order_by(Memory.created_at.desc()).all()
    
    if not memories:
        return json.dumps({
            "greeting": "Welcome to your smart journal Companion! Start by writing your first memory and I'll help you reflect on it.",
            "highlight_id": None,
            "highlight_reason": "No memories yet to revisit.",
            "suggestions": [
                "How do I start my first entry?",
                "Write about my day today",
                "What can my companion do?"
            ],
            "connections": [
                "You're at the very beginning of a beautiful journaling journey."
            ]
        })

    # Prepare context for AI
    memories_text_list = []
    for m in memories[:50]: # limit to most recent 50 for greeting speed and token sanity
        clean_content = re.sub(r"<[^>]*>", "", m.content or "")
        memories_text_list.append(
            f"[ID: {m.id}]\n"
            f"Date: {m.created_at.date()}\n"
            f"Title: {m.title}\n"
            f"Mood: {m.mood or 'Neutral'}\n"
            f"Location: {m.location or 'none'}\n"
            f"Content: {clean_content}\n"
        )
    memories_text = "\n\n".join(memories_text_list)
    
    try:
        raw_json = generate_companion_greeting(memories_text, today_str)
        cleaned = clean_json_text(raw_json)
        data = json.loads(cleaned)
        
        # Validate critical fields
        if "greeting" not in data:
            data["greeting"] = "Welcome back! Ready to write your next page?"
        if "suggestions" not in data or not isinstance(data["suggestions"], list):
            data["suggestions"] = ["Show me my happiest memories", "Find entries about travel", "Revisit last week"]
        if "connections" not in data or not isinstance(data["connections"], list):
            data["connections"] = ["Every entry you write helps me notice patterns in your days."]
            
        return json.dumps(data)
    except Exception as e:
        logger.exception("Error generating companion greeting: %s", str(e))
        
        # Fallback local calculations
        now = datetime.utcnow()
        anniversary = None
        for m in memories:
            d = m.created_at
            if d.month == now.month and d.day == now.day and d.year < now.year:
                anniversary = m
                break
                
        greeting = "Good evening! Ready to reflect on today's chapters?"
        highlight_id = memories[0].id
        highlight_reason = "Let's revisit your most recent entry."
        
        if anniversary:
            years = now.year - anniversary.created_at.year
            greeting = f"Welcome back! {years} year{'s' if years > 1 else ''} ago today, you wrote about '{anniversary.title}'."
            highlight_id = anniversary.id
            highlight_reason = "An anniversary memory worth looking back on."
            
        return json.dumps({
            "greeting": greeting,
            "highlight_id": highlight_id,
            "highlight_reason": highlight_reason,
            "suggestions": [
                f"Show my entries with mood '{memories[0].mood or 'Happy'}'",
                f"Find memories in '{memories[0].location or 'Home'}'",
                "Revisit my longest diary entry"
            ],
            "connections": [
                "Reflecting on past moods and memories helps you see how far you've come."
            ]
        })

def get_weekly_letter(db: Session, user_id: int) -> str:
    user = db.query(User).filter(User.id == user_id).first()
    user_name = user.name if user else "Writer"
    today_str = datetime.utcnow().strftime("%A, %B %d, %Y")
    
    # Fetch memories from past 7 days
    one_week_ago = datetime.utcnow() - timedelta(days=7)
    memories = db.query(Memory).filter(
        Memory.user_id == user_id,
        Memory.created_at >= one_week_ago
    ).order_by(Memory.created_at.desc()).all()
    
    # If too few memories this week, fall back to last 10 entries for context richness
    if len(memories) < 3:
        memories = db.query(Memory).filter(Memory.user_id == user_id).order_by(Memory.created_at.desc()).limit(10).all()
        
    if not memories:
        return json.dumps({
            "salutation": f"Dear {user_name},",
            "body": "It looks like your journal pages have been quiet this week. Whenever you're ready, pick up the pen. I'll be here to listen and keep track of your thoughts.",
            "closing": "Warmly,",
            "signature": "Your Journal Companion 🌿",
            "stats": {
                "entries_written": 0,
                "moods_logged": [],
                "places_mentioned": [],
                "photos_added": 0,
                "happiest_day": "None",
                "total_words": 0
            }
        })
        
    memories_text_list = []
    total_words = 0
    moods = []
    places = []
    photos = 0
    
    for m in memories:
        clean_content = re.sub(r"<[^>]*>", "", m.content or "")
        total_words += len(clean_content.split())
        if m.mood and m.mood not in moods:
            moods.append(m.mood)
        if m.location and m.location not in places:
            places.append(m.location)
        if m.image_url:
            photos += 1
        if m.image_url2:
            photos += 1
        if m.image_url3:
            photos += 1
            
        mem_str = (
            f"[ID: {m.id}]\n"
            f"Date: {m.created_at.date()}\n"
            f"Title: {m.title}\n"
            f"Mood: {m.mood or 'Neutral'}\n"
            f"Location: {m.location or 'none'}\n"
            f"Content: {clean_content}\n"
        )
        memories_text_list.append(mem_str)
        
    memories_text = "\n\n".join(memories_text_list)
    memories_text = memories_text[:50000]
    
    try:
        raw_json = generate_weekly_letter(memories_text, user_name, today_str)
        cleaned = clean_json_text(raw_json)
        data = json.loads(cleaned)
        
        # Override stats with actual backend values to guarantee absolute accuracy
        data["stats"] = {
            "entries_written": len(memories),
            "moods_logged": moods[:3],
            "places_mentioned": places[:3],
            "photos_added": photos,
            "happiest_day": data.get("stats", {}).get("happiest_day", "Friday"),
            "total_words": total_words
        }
        return json.dumps(data)
    except Exception as e:
        logger.exception("Error generating weekly letter: %s", str(e))
        
        return json.dumps({
            "salutation": f"Dear {user_name},",
            "body": f"This week, you took the time to write {len(memories)} entries, reflecting on your days and capturing your thoughts. Every memory logged is a chapter of your personal growth. Keep writing, keep sharing, and keep building this beautiful library of your life.",
            "closing": "With warm thoughts,",
            "signature": "Your Journal Companion 🌿",
            "stats": {
                "entries_written": len(memories),
                "moods_logged": moods[:3],
                "places_mentioned": places[:3],
                "photos_added": photos,
                "happiest_day": "Friday",
                "total_words": total_words
            }
        })
