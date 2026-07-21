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


def _safe_ai(fn, fallback):
    """Call AI function; return fallback string on any error (quota, network, etc.)."""
    try:
        return fn()
    except Exception:
        return fallback


def get_weekly_reflection(db: Session, user_id: int) -> str:
    week_ago = datetime.utcnow() - timedelta(days=7)
    memories = db.query(Memory).filter(
        Memory.user_id == user_id,
        Memory.created_at >= week_ago
    ).order_by(Memory.created_at.desc()).all()

    if not memories:
        return "You haven't written anything this week yet. Start with how today felt — even one sentence counts!"

    # Build a readable summary even without AI
    titles  = [m.title for m in memories if m.title]
    moods   = [m.mood  for m in memories if m.mood]
    count   = len(memories)
    mood_summary = ", ".join(set(moods)) if moods else "varied"

    fallback = (
        f"This week you wrote {count} {'entry' if count == 1 else 'entries'}. "
        f"Your mood ranged across: {mood_summary}. "
        f"Entries included: {', '.join(titles[:3])}{'…' if len(titles) > 3 else ''}. "
        "Keep reflecting — your journal is growing!"
    )

    memories_text = "\n\n".join([
        f"Date: {m.created_at.date()}\nTitle: {m.title}\nMood: {m.mood}\nContent: {(m.content or '')[:300]}"
        for m in memories
    ])[:10000]

    return _safe_ai(lambda: generate_weekly_reflection(memories_text), fallback)


def get_monthly_reflection(db: Session, user_id: int) -> str:
    month_ago = datetime.utcnow() - timedelta(days=30)
    memories = db.query(Memory).filter(
        Memory.user_id == user_id,
        Memory.created_at >= month_ago
    ).order_by(Memory.created_at.desc()).all()

    if not memories:
        return "No entries this month yet. Every journey starts with the first step — write something today!"

    count = len(memories)
    moods = [m.mood for m in memories if m.mood]
    top_mood = Counter(moods).most_common(1)[0][0] if moods else "Neutral"

    fallback = (
        f"This month you wrote {count} {'entry' if count == 1 else 'entries'}. "
        f"Your most common mood was {top_mood}. "
        "Great consistency — keep building that habit!"
    )

    memories_text = "\n\n".join([
        f"Date: {m.created_at.date()}\nTitle: {m.title}\nMood: {m.mood}\nContent: {(m.content or '')[:200]}"
        for m in memories
    ])[:20000]

    return _safe_ai(lambda: generate_monthly_reflection(memories_text), fallback)


def get_mood_analysis(db: Session, user_id: int) -> str:
    month_ago = datetime.utcnow() - timedelta(days=30)
    memories = db.query(Memory).filter(
        Memory.user_id == user_id,
        Memory.created_at >= month_ago
    ).all()

    if not memories:
        return "No mood data yet this month. Log your mood when writing to see patterns here!"

    mood_counts = Counter(m.mood for m in memories if m.mood)
    if not mood_counts:
        return "No moods logged yet. Select a mood when saving your entries to track how you feel over time."

    top_mood, top_count = mood_counts.most_common(1)[0]
    total = sum(mood_counts.values())
    pct   = round((top_count / total) * 100)

    fallback = (
        f"Over the past 30 days you logged {total} moods. "
        f"Your most frequent mood was **{top_mood}** ({pct}% of entries). "
        + (f"Other moods: {', '.join(f'{m} ({c})' for m, c in mood_counts.most_common()[1:4])}." if len(mood_counts) > 1 else "")
    )

    moods_text = "\n".join([
        f"Date: {m.created_at.date()}, Mood: {m.mood or 'Unknown'}"
        for m in memories
    ])
    return _safe_ai(lambda: generate_mood_analysis(moods_text), fallback)


def get_habit_detection(db: Session, user_id: int) -> str:
    memories = db.query(Memory).filter(
        Memory.user_id == user_id
    ).order_by(Memory.created_at.desc()).limit(30).all()

    if not memories:
        return "No writing habit detected yet — start writing regularly to see your patterns!"

    # Day-of-week distribution
    day_counts = Counter(m.created_at.strftime("%A") for m in memories)
    top_day    = day_counts.most_common(1)[0][0] if day_counts else "Unknown"

    # Time-of-day distribution
    hour_buckets = {"Morning (6–12)": 0, "Afternoon (12–17)": 0, "Evening (17–22)": 0, "Night (22–6)": 0}
    for m in memories:
        h = m.created_at.hour
        if 6  <= h < 12: hour_buckets["Morning (6–12)"]   += 1
        elif 12 <= h < 17: hour_buckets["Afternoon (12–17)"] += 1
        elif 17 <= h < 22: hour_buckets["Evening (17–22)"]   += 1
        else:              hour_buckets["Night (22–6)"]      += 1
    top_time = max(hour_buckets, key=hour_buckets.get)

    fallback = (
        f"You tend to write most on **{top_day}s** and usually during the **{top_time}**. "
        f"You've written {len(memories)} entries recently — that's a solid habit!"
    )

    timestamps_text = "\n".join(str(m.created_at) for m in memories)
    return _safe_ai(lambda: generate_habit_detection(timestamps_text), fallback)


def get_productivity_insights(db: Session, user_id: int) -> str:
    memories = db.query(Memory).filter(Memory.user_id == user_id).all()

    if not memories:
        return "Not enough data for productivity insights yet."

    day_counts = Counter(m.created_at.strftime("%A") for m in memories)
    top_day    = day_counts.most_common(1)[0][0] if day_counts else "Unknown"
    top_count  = day_counts[top_day]

    fallback = f"Your most productive day is **{top_day}** with {top_count} entries — you're a {top_day} writer!"

    data_text = "\n".join(f"{day}: {count} entries" for day, count in day_counts.items())
    return _safe_ai(lambda: generate_productivity_insights(data_text), fallback)


def get_ai_suggestions(db: Session, user_id: int) -> str:
    last_memory = db.query(Memory).filter(
        Memory.user_id == user_id
    ).order_by(Memory.created_at.desc()).first()

    days_since_last = 0
    if last_memory:
        days_since_last = (datetime.utcnow() - last_memory.created_at).days

    streak_data    = get_writing_streak(db, user_id)
    longest_streak = streak_data.get("longest_streak", 0)
    top_tags       = get_top_tags(db, user_id)
    top_tag        = top_tags[0]["tag"] if top_tags else None

    if days_since_last == 0:
        fallback = "Great job writing today! Try adding more detail about how you felt in the moment."
    elif days_since_last == 1:
        fallback = "You wrote yesterday — keep that momentum going! What's on your mind today?"
    elif days_since_last <= 3:
        fallback = f"It's been {days_since_last} days since your last entry. Even a short paragraph keeps the habit alive!"
    else:
        tag_hint = f" Maybe write about {top_tag}?" if top_tag else ""
        fallback = f"You haven't written in {days_since_last} days.{tag_hint} Your longest streak was {longest_streak} days — you can beat it!"

    return _safe_ai(
        lambda: generate_ai_suggestion(days_since_last, longest_streak, top_tag or "life"),
        fallback
    )


def get_companion_message(db: Session, user_id: int) -> str:
    last_memories = db.query(Memory).filter(
        Memory.user_id == user_id
    ).order_by(Memory.created_at.desc()).limit(3).all()

    if not last_memories:
        return "Your journal is waiting — the first word is the hardest."

    now      = datetime.utcnow()
    last     = last_memories[0]
    days_ago = (now - last.created_at).days

    if days_ago == 0:
        fallback = f"Welcome back! You wrote today — \"{last.title}\". Keep it up!"
    elif days_ago == 1:
        fallback = f"Hey, you wrote yesterday. Ready to add today's story?"
    else:
        fallback = f"It's been {days_ago} days since \"{last.title}\". Your journal misses you 😊"

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
    return _safe_ai(lambda: generate_companion_message(context), fallback)
