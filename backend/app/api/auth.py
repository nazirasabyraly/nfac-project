from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import JSONResponse
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.config import FRONTEND_URL
from ..database import get_db
from ..models.user import User
from app.services.auth_service import AuthService

router = APIRouter()
auth_service = AuthService()

@router.get("/ngrok-url")
async def get_ngrok_url(request: Request):
    """Возвращает текущий URL бэкенда для настройки фронтенда"""
    base_url = str(request.base_url).rstrip('/')
    return {"backend_url": base_url}

@router.get("/callback")
async def callback(access_token: str = None):
    """Обрабатывает callback с access_token от Spotify"""
    if not access_token:
        raise HTTPException(status_code=400, detail="Missing access_token")
    
    # Просто перенаправляем на фронтенд с токеном
    return RedirectResponse(
        f"{FRONTEND_URL}/callback?access_token={access_token}"
    )

@router.get("/spotify/token")
async def spotify_token(code: str = None, error: str = None, db: Session = Depends(get_db)):
    from app.config import FRONTEND_URL
    from fastapi import HTTPException

    if error:
        raise HTTPException(status_code=400, detail=f"Spotify error: {error}")

    if not code:
        raise HTTPException(status_code=400, detail="Missing code parameter")

    try:
        token_data = await exchange_code_for_token(code)
        access_token = token_data["access_token"]
        refresh_token = token_data.get("refresh_token")
        profile = await get_user_profile(access_token)
        spotify_id = profile.get("id")

        user = db.query(User).filter(User.spotify_id == spotify_id).first()

        if user:
            auth_service.update_spotify_tokens(db, user.id, spotify_id, access_token, refresh_token)
        else:
            print(f"⚠️  Пользователь с Spotify ID {spotify_id} не найден")

        return {
            "access_token": access_token,
            "spotify_id": spotify_id
        }

    except SpotifyAuthError as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=401, detail=f"Spotify auth error: {str(e)}")
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Auth failed: {str(e)}")
