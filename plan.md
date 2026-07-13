# Implementation Plan for Phase 5 (Smart AI Features)

This plan details how we will implement the **Smart AI Features** described in Phase 5 of the Smart Diary roadmap.

## User Review Required

> [!IMPORTANT]
> Please review this implementation plan for Phase 5. If it looks good to you, click the **Proceed** button to authorize me to write the code. 
> 
> *Note: I've opted to create a separate `smart_ai_service.py` and a new router `app/routes/smart_ai.py` to keep the context-aware, stateful AI features separate from the stateless AI tools built in Phase 4.*

## Open Questions

> [!NOTE]
> 1. Are you okay with creating a new route prefix `/smart-ai` for these features?
> 2. For the weekly and monthly reflections, I'll aggregate the content of memories. If a user has 100 memories in a month, that might exceed token limits. Should I truncate or sample the memories, or assume the model (`gemini-2.0-flash`) can handle the context window? (I'll implement basic string truncation as a safety measure).

## Proposed Changes

---

### AI Service & Prompts

#### [MODIFY] [prompts.py](file:///C:/Users/mehek/Desktop/smart-diary-web/backend/app/ai/prompts.py)
- Add `WEEKLY_REFLECTION_PROMPT`, `MONTHLY_REFLECTION_PROMPT`, `MOOD_ANALYSIS_PROMPT`, `HABIT_DETECTION_PROMPT`, `PRODUCTIVITY_PROMPT`, `SUGGESTION_PROMPT`.

#### [MODIFY] [gemini_service.py](file:///C:/Users/mehek/Desktop/smart-diary-web/backend/app/ai/gemini_service.py)
- Add corresponding helper functions that accept aggregated data and call Gemini (e.g., `generate_weekly_reflection(memories_text)`, etc.).

---

### Smart AI Service

#### [NEW] [smart_ai_service.py](file:///C:/Users/mehek/Desktop/smart-diary-web/backend/app/services/smart_ai_service.py)
Create a new service module to fetch data from the database, aggregate it, and pass it to the AI.
- `get_weekly_reflection(db, user_id)`: Fetches memories from the last 7 days.
- `get_monthly_reflection(db, user_id)`: Fetches memories from the last 30 days.
- `get_mood_analysis(db, user_id)`: Fetches moods and timestamps from the last 30 days.
- `get_habit_detection(db, user_id)`: Analyzes timestamps of all memories to determine writing patterns.
- `get_productivity_insights(db, user_id)`: Analyzes memory counts by day of the week and word counts.
- `get_ai_suggestions(db, user_id)`: Checks streak, last entry date, and suggests topics or motivation.

---

### Routing & API

#### [NEW] [smart_ai.py](file:///C:/Users/mehek/Desktop/smart-diary-web/backend/app/routes/smart_ai.py)
Create a new FastAPI router with the following protected endpoints (requiring the authenticated user):
- `GET /smart-ai/weekly-reflection`
- `GET /smart-ai/monthly-reflection`
- `GET /smart-ai/mood-analysis`
- `GET /smart-ai/habit-detection`
- `GET /smart-ai/productivity`
- `GET /smart-ai/suggestions`

#### [MODIFY] [main.py](file:///C:/Users/mehek/Desktop/smart-diary-web/backend/app/main.py)
- Import and include the new `smart_ai` router.

## Verification Plan

### Automated Tests
None specifically configured for this, but I will ensure the FastAPI application starts without syntax errors using Python.

### Manual Verification
1. Open the Swagger UI (`/docs`).
2. Authenticate as a test user.
3. Call the new `/smart-ai/...` endpoints and verify they successfully return AI-generated insights based on the user's data.
