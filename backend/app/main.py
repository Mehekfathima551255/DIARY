from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.routes.auth import router as auth_router
from app.routes.memory import router as memory_router
from app.routes.dashboard import router as dashboard_router
from app.routes.ai import router as ai_router
from app.routes.smart_ai import router as smart_ai_router
from app.routes.chat import router as chat_router


app = FastAPI(
    title="Smart Diary API",
    version="1.0.0"
)

app.include_router(auth_router)
app.include_router(memory_router)
app.include_router(dashboard_router)
app.include_router(ai_router)
app.include_router(smart_ai_router)
app.include_router(chat_router)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
def home():
    return {
        "message": "Welcome to Smart Diary API 🚀"
    }