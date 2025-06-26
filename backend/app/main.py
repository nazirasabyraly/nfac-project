# VibeMatch/backend/app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api import auth, media, recommend, chat, users
from app.config import HOST, PORT
from app.models.user import Base
from app.database import engine

app = FastAPI(title="VibeMatch API")
app.mount("/audio_cache", StaticFiles(directory="audio_cache"), name="audio_cache")

# Создаем таблицы при запуске
Base.metadata.create_all(bind=engine)

# CORS (разрешаем доступ с фронта)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роуты
app.include_router(auth.router, prefix="/auth")
app.include_router(media.router, prefix="/media")
app.include_router(recommend.router, prefix="/recommend")
app.include_router(chat.router, prefix="/chat")
app.include_router(users.router, prefix="/users")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=HOST, port=PORT)
