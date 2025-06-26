from fastapi import APIRouter, Query
from typing import List
import requests
import os

router = APIRouter()

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

# Здесь будут рекомендации через YouTube и аналитику лайков

@router.get("/youtube-search")
def youtube_search(q: str = Query(..., description="Поисковый запрос (название трека, артист и т.д.)"), max_results: int = 5):
    if not YOUTUBE_API_KEY:
        return {"error": "YOUTUBE_API_KEY not set"}
    url = "https://www.googleapis.com/youtube/v3/search"
    params = {
        "part": "snippet",
        "q": q,
        "type": "video",
        "maxResults": max_results,
        "key": YOUTUBE_API_KEY
    }
    resp = requests.get(url, params=params)
    if resp.status_code != 200:
        return {"error": f"YouTube API error: {resp.text}"}
    data = resp.json()
    results = []
    for item in data.get("items", []):
        results.append({
            "video_id": item["id"]["videoId"],
            "title": item["snippet"]["title"],
            "channel": item["snippet"]["channelTitle"],
            "thumbnail": item["snippet"]["thumbnails"]["medium"]["url"]
        })
    return {"results": results}
