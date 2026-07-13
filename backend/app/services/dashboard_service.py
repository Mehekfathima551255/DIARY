from datetime import datetime, timedelta
from collections import Counter
from sqlalchemy.orm import Session

from app.models.memory import Memory


# -------------------------------
# Dashboard Statistics
# -------------------------------
def get_dashboard_stats(
    db: Session,
    user_id: int
):
    now = datetime.utcnow()

    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)

    memories = (
        db.query(Memory)
        .filter(Memory.user_id == user_id)
        .all()
    )

    total_memories = len(memories)

    favorite_memories = sum(
        1 for memory in memories
        if memory.favorite
    )

    mood_counts = {}

    for memory in memories:
        mood = memory.mood or "Unknown"
        mood_counts[mood] = mood_counts.get(mood, 0) + 1

    weekly_memories = sum(
        1
        for memory in memories
        if memory.created_at >= week_ago
    )

    monthly_memories = sum(
        1
        for memory in memories
        if memory.created_at >= month_ago
    )

    return {
        "overview": {
            "total_memories": total_memories,
            "favorite_memories": favorite_memories
        },
        "moods": mood_counts,
        "weekly_memories": weekly_memories,
        "monthly_memories": monthly_memories
    }


# -------------------------------
# Mood Distribution
# -------------------------------
def get_mood_distribution(
    db: Session,
    user_id: int
):
    memories = (
        db.query(Memory)
        .filter(Memory.user_id == user_id)
        .all()
    )

    mood_counts = {}

    for memory in memories:
        mood = memory.mood or "Unknown"
        mood_counts[mood] = mood_counts.get(mood, 0) + 1

    return mood_counts


# -------------------------------
# Top Tags
# -------------------------------
def get_top_tags(
    db: Session,
    user_id: int
):
    memories = (
        db.query(Memory)
        .filter(Memory.user_id == user_id)
        .all()
    )

    all_tags = []

    for memory in memories:
        if memory.tags:
            tags = [
                tag.strip()
                for tag in memory.tags.split(",")
                if tag.strip()
            ]
            all_tags.extend(tags)

    counter = Counter(all_tags)

    return [
        {
            "tag": tag,
            "count": count
        }
        for tag, count in counter.most_common(10)
    ]


# -------------------------------
# Recent Memories
# -------------------------------
def get_recent_memories(
    db: Session,
    user_id: int,
    limit: int = 5
):
    return (
        db.query(Memory)
        .filter(Memory.user_id == user_id)
        .order_by(Memory.created_at.desc())
        .limit(limit)
        .all()
    )


# -------------------------------
# Writing Streak
# -------------------------------
def get_writing_streak(
    db: Session,
    user_id: int
):
    memories = (
        db.query(Memory)
        .filter(Memory.user_id == user_id)
        .order_by(Memory.created_at.asc())
        .all()
    )

    if not memories:
        return {
            "current_streak": 0,
            "longest_streak": 0
        }

    unique_days = sorted(
        {memory.created_at.date() for memory in memories}
    )

    longest = 1
    current = 1

    for i in range(1, len(unique_days)):
        if unique_days[i] == unique_days[i - 1] + timedelta(days=1):
            current += 1
            longest = max(longest, current)
        else:
            current = 1

    today = datetime.utcnow().date()

    streak = 0

    for day in reversed(unique_days):
        if day == today or day == today - timedelta(days=streak):
            streak += 1
        else:
            break

    return {
        "current_streak": streak,
        "longest_streak": longest
    }


# -------------------------------
# Calendar Heatmap
# -------------------------------
def get_calendar_heatmap(
    db: Session,
    user_id: int
):
    memories = (
        db.query(Memory)
        .filter(Memory.user_id == user_id)
        .all()
    )

    heatmap = {}

    for memory in memories:
        day = memory.created_at.strftime("%Y-%m-%d")

        if day not in heatmap:
            heatmap[day] = 0

        heatmap[day] += 1

    return heatmap