# VibeMatch/backend/app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, media, recommend, chat, users
from app.config import HOST, PORT
from app.models.user import Base
from app.database import engine

app = FastAPI(title="VibeMatch API")

# Создаем таблицы при запуске
Base.metadata.create_all(bind=engine)

# CORS (разрешаем доступ с фронта)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://bite-decreased-funny-draft.trycloudflare.com",
        "http://localhost:3000",
        "https://localhost:3000",
        "http://127.0.0.1:3000",
        "https://127.0.0.1:3000"
    ],
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

# Добавляем callback endpoint без префикса
@app.get("/callback")
async def callback(access_token: str = None):
    """Обрабатывает callback с access_token от Spotify"""
    from app.config import FRONTEND_URL
    
    if not access_token:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Missing access_token")
    
    # Просто перенаправляем на фронтенд с токеном
    from fastapi.responses import RedirectResponse
    return RedirectResponse(
        f"{FRONTEND_URL}/callback?access_token={access_token}"
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=HOST, port=PORT)
