from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.responses import RedirectResponse

from app.services.spotify import (
    get_spotify_auth_url,
    exchange_code_for_token,
    get_user_profile
)
from app.config import FRONTEND_URL

router = APIRouter()

@router.get("/ngrok-url")
async def get_ngrok_url(request: Request):
    """Возвращает текущий URL бэкенда для настройки фронтенда"""
    base_url = str(request.base_url).rstrip('/')
    return {"backend_url": base_url}

@router.get("/spotify/login")
async def spotify_login():
    auth_url = get_spotify_auth_url()
    return RedirectResponse(auth_url)
  # или редирект

@router.get("/callback")
async def callback(access_token: str = None):
    """Обрабатывает callback с access_token от Spotify"""
    if not access_token:
        raise HTTPException(status_code=400, detail="Missing access_token")
    
    # Просто перенаправляем на фронтенд с токеном
    return RedirectResponse(
        f"{FRONTEND_URL}/callback?access_token={access_token}"
    )

@router.get("/spotify/callback")
async def spotify_callback(code: str = None, error: str = None):
    print(f"🔍 Spotify callback called")
    print(f"📋 Parameters: code={'present' if code else 'missing'}, error={error}")
    
    if error:
        print(f"❌ Spotify error: {error}")
        raise HTTPException(status_code=400, detail=error)
    if not code:
        print(f"❌ Missing code parameter")
        raise HTTPException(status_code=400, detail="Missing code")

    try:
        print(f"🔄 Exchanging code for token...")
        token_data = await exchange_code_for_token(code)
        print(f"✅ Token exchange successful: {token_data.keys()}")
        
        access_token = token_data["access_token"]
        print(f"🎯 Access token length: {len(access_token) if access_token else 0}")
        
        # Возвращаем JSON с токеном вместо редиректа
        response_data = {
            "access_token": access_token,
            "token_type": token_data.get("token_type", "Bearer"),
            "expires_in": token_data.get("expires_in", 3600)
        }
        print(f"📤 Returning response: {response_data.keys()}")
        return JSONResponse(response_data)

    except Exception as e:
        print(f"❌ Error in spotify_callback: {str(e)}")
        print(f"❌ Error type: {type(e).__name__}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Auth failed: {str(e)}")
