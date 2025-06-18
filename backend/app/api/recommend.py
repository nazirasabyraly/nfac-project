from fastapi import APIRouter, Query, HTTPException
from app.services.spotify import get_user_top_tracks

router = APIRouter()

@router.get("/top-tracks")
async def top_tracks(access_token: str = Query(...)):
    try:
        tracks = await get_user_top_tracks(access_token)
        return {"tracks": tracks}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
