# backend/app/api/media.py

from fastapi import APIRouter, HTTPException, Depends
from app.services.spotify import (
    get_user_top_tracks,
    get_user_recently_played,
    get_user_playlists,
    get_user_liked_tracks,
    analyze_user_music_taste,
    get_tracks_with_features
)

router = APIRouter()

def get_access_token():
    """Получает access token из заголовка Authorization"""
    from fastapi import Header
    from fastapi import HTTPException
    
    async def _get_token(authorization: str = Header(None)):
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
        return authorization.replace("Bearer ", "")
    
    return _get_token

@router.get("/profile")
async def get_user_profile(access_token: str = Depends(get_access_token())):
    """Получает профиль пользователя"""
    from app.services.spotify import get_user_profile
    try:
        profile = await get_user_profile(access_token)
        return profile
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/top-tracks")
async def get_top_tracks(access_token: str = Depends(get_access_token()), limit: int = 10):
    """Получает топ треки пользователя"""
    try:
        tracks = await get_user_top_tracks(access_token, limit)
        return {"tracks": tracks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recently-played")
async def get_recently_played(access_token: str = Depends(get_access_token()), limit: int = 20):
    """Получает недавно прослушанные треки"""
    try:
        tracks = await get_user_recently_played(access_token, limit)
        return {"tracks": tracks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/playlists")
async def get_playlists(access_token: str = Depends(get_access_token()), limit: int = 20):
    """Получает плейлисты пользователя"""
    try:
        playlists = await get_user_playlists(access_token, limit)
        return {"playlists": playlists}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/liked-tracks")
async def get_liked_tracks(access_token: str = Depends(get_access_token()), limit: int = 20):
    """Получает любимые треки пользователя"""
    try:
        tracks = await get_user_liked_tracks(access_token, limit)
        return {"tracks": tracks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analysis")
async def get_music_analysis(access_token: str = Depends(get_access_token())):
    """Анализирует музыкальные предпочтения пользователя"""
    try:
        analysis = await analyze_user_music_taste(access_token)
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tracks/{track_ids}")
async def get_tracks_features(track_ids: str, access_token: str = Depends(get_access_token())):
    """Получает треки с их аудио характеристиками"""
    try:
        track_id_list = track_ids.split(",")
        tracks = await get_tracks_with_features(track_id_list, access_token)
        return {"tracks": tracks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
