# backend/app/services/spotify.py

import httpx
import base64
from typing import List
from app.config import SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI

SPOTIFY_API_BASE = "https://api.spotify.com/v1"



async def get_user_profile(access_token: str):
    headers = {
        "Authorization": f"Bearer {access_token}"
    }

    async with httpx.AsyncClient() as client:
        response = await client.get("https://api.spotify.com/v1/me", headers=headers)
        response.raise_for_status()
        return response.json()

def get_spotify_auth_url():
    # Расширенный scope для получения всех необходимых данных
    scope = "user-top-read user-read-recently-played user-read-private user-read-email playlist-read-private user-library-read"
    # Используем frontend ngrok URL для callback
    frontend_callback_url = "https://9a9d-95-56-238-194.ngrok-free.app/callback"
    return (
        f"https://accounts.spotify.com/authorize"
        f"?client_id={SPOTIFY_CLIENT_ID}"
        f"&response_type=code"
        f"&redirect_uri={frontend_callback_url}"
        f"&scope={scope}"
    )

async def exchange_code_for_token(code: str):
    print(f"🔄 Starting token exchange for code: {code[:10]}...")
    
    url = "https://accounts.spotify.com/api/token"
    
    # Используем frontend ngrok URL для callback
    frontend_callback_url = "https://9a9d-95-56-238-194.ngrok-free.app/callback"
    print(f"🌐 Using redirect_uri: {frontend_callback_url}")

    headers = {
        "Authorization": "Basic " + base64.b64encode(
            f"{SPOTIFY_CLIENT_ID}:{SPOTIFY_CLIENT_SECRET}".encode()
        ).decode(),
        "Content-Type": "application/x-www-form-urlencoded"
    }

    data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": frontend_callback_url
    }
    
    print(f"📤 Request data: {data}")
    print(f"🔑 Client ID: {SPOTIFY_CLIENT_ID[:10]}...")

    async with httpx.AsyncClient() as client:
        try:
            print(f"🌐 Sending request to Spotify...")
            response = await client.post(url, data=data, headers=headers)
            print(f"📡 Response status: {response.status_code}")
            print(f"📡 Response headers: {dict(response.headers)}")
            
            if response.status_code != 200:
                error_text = response.text
                print(f"❌ Spotify error response: {error_text}")
                raise Exception(f"Spotify API error: {response.status_code} - {error_text}")
            
            response_data = response.json()
            print(f"✅ Token exchange successful: {list(response_data.keys())}")
            return response_data
            
        except Exception as e:
            print(f"❌ Exception in exchange_code_for_token: {str(e)}")
            raise e


# 🔽 Новый код — получение топ треков и фич
async def get_user_top_tracks(access_token: str, limit: int = 10):
    headers = {
        "Authorization": f"Bearer {access_token}"
    }

    async with httpx.AsyncClient() as client:
        # Получаем топ треки
        response = await client.get(
            f"{SPOTIFY_API_BASE}/me/top/tracks",
            headers=headers,
            params={"limit": limit}
        )
        response.raise_for_status()
        top_tracks = response.json()["items"]

        track_ids = [track["id"] for track in top_tracks]

        # Получаем фичи
        features_response = await client.get(
            f"{SPOTIFY_API_BASE}/audio-features",
            headers=headers,
            params={"ids": ",".join(track_ids)}
        )
        features_response.raise_for_status()
        features = features_response.json()["audio_features"]

        # Собираем финальный список
        result = []
        for track, feature in zip(top_tracks, features):
            result.append({
                "name": track["name"],
                "artist": track["artists"][0]["name"],
                "id": track["id"],
                "valence": feature.get("valence"),
                "energy": feature.get("energy"),
                "danceability": feature.get("danceability"),
                "preview_url": track["preview_url"],
                "image": track["album"]["images"][0]["url"]
            })

        return result

# 🔽 Новые функции для VibeMatch
async def get_user_recently_played(access_token: str, limit: int = 20):
    """Получает недавно прослушанные треки пользователя"""
    headers = {
        "Authorization": f"Bearer {access_token}"
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{SPOTIFY_API_BASE}/me/player/recently-played",
            headers=headers,
            params={"limit": limit}
        )
        response.raise_for_status()
        return response.json()["items"]

async def get_user_playlists(access_token: str, limit: int = 20):
    """Получает плейлисты пользователя"""
    headers = {
        "Authorization": f"Bearer {access_token}"
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{SPOTIFY_API_BASE}/me/playlists",
            headers=headers,
            params={"limit": limit}
        )
        response.raise_for_status()
        return response.json()["items"]

async def get_user_liked_tracks(access_token: str, limit: int = 20):
    """Получает любимые треки пользователя"""
    headers = {
        "Authorization": f"Bearer {access_token}"
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{SPOTIFY_API_BASE}/me/tracks",
            headers=headers,
            params={"limit": limit}
        )
        response.raise_for_status()
        return response.json()["items"]

async def get_tracks_with_features(track_ids: list, access_token: str):
    """Получает треки с их аудио характеристиками"""
    headers = {
        "Authorization": f"Bearer {access_token}"
    }

    async with httpx.AsyncClient() as client:
        # Получаем информацию о треках
        tracks_response = await client.get(
            f"{SPOTIFY_API_BASE}/tracks",
            headers=headers,
            params={"ids": ",".join(track_ids)}
        )
        tracks_response.raise_for_status()
        tracks = tracks_response.json()["tracks"]

        # Получаем аудио характеристики
        features_response = await client.get(
            f"{SPOTIFY_API_BASE}/audio-features",
            headers=headers,
            params={"ids": ",".join(track_ids)}
        )
        features_response.raise_for_status()
        features = features_response.json()["audio_features"]

        # Объединяем данные
        result = []
        for track, feature in zip(tracks, features):
            if track and feature:
                result.append({
                    "id": track["id"],
                    "name": track["name"],
                    "artist": track["artists"][0]["name"],
                    "album": track["album"]["name"],
                    "image": track["album"]["images"][0]["url"] if track["album"]["images"] else None,
                    "preview_url": track["preview_url"],
                    "popularity": track["popularity"],
                    # Аудио характеристики
                    "valence": feature.get("valence", 0),  # Позитивность (0-1)
                    "energy": feature.get("energy", 0),    # Энергичность (0-1)
                    "danceability": feature.get("danceability", 0),  # Танцевальность (0-1)
                    "tempo": feature.get("tempo", 0),      # Темп (BPM)
                    "acousticness": feature.get("acousticness", 0),  # Акустичность (0-1)
                    "instrumentalness": feature.get("instrumentalness", 0),  # Инструментальность (0-1)
                    "liveness": feature.get("liveness", 0),  # Живость (0-1)
                    "speechiness": feature.get("speechiness", 0),  # Речевость (0-1)
                    "mode": feature.get("mode", 0),        # Мажор/минор (0/1)
                    "key": feature.get("key", 0),          # Тональность (0-11)
                })

        return result

async def analyze_user_music_taste(access_token: str):
    """Анализирует музыкальные предпочтения пользователя"""
    try:
        print(f"🔍 Starting music taste analysis...")
        
        # Получаем различные данные
        top_tracks = []
        recent_tracks = []
        liked_tracks = []
        
        try:
            top_tracks = await get_user_top_tracks(access_token, 20)
            print(f"✅ Got {len(top_tracks)} top tracks")
        except Exception as e:
            print(f"⚠️ Could not get top tracks: {str(e)}")
        
        try:
            recent_tracks = await get_user_recently_played(access_token, 20)
            print(f"✅ Got {len(recent_tracks)} recent tracks")
        except Exception as e:
            print(f"⚠️ Could not get recent tracks: {str(e)}")
        
        try:
            liked_tracks = await get_user_liked_tracks(access_token, 20)
            print(f"✅ Got {len(liked_tracks)} liked tracks")
        except Exception as e:
            print(f"⚠️ Could not get liked tracks: {str(e)}")
        
        # Объединяем все треки
        all_tracks = []
        all_tracks.extend(top_tracks)
        all_tracks.extend(recent_tracks)
        all_tracks.extend(liked_tracks)
        
        print(f"📊 Total tracks collected: {len(all_tracks)}")
        
        if len(all_tracks) == 0:
            return {
                "error": "Недостаточно данных для анализа. Попробуйте послушать больше музыки в Spotify или лайкнуть несколько треков."
            }
        
        # Убираем дубликаты
        unique_tracks = {track["id"]: track for track in all_tracks}.values()
        unique_tracks = list(unique_tracks)
        
        print(f"📊 Unique tracks after deduplication: {len(unique_tracks)}")
        
        if len(unique_tracks) < 3:
            return {
                "error": f"Слишком мало треков для анализа ({len(unique_tracks)}). Нужно минимум 3 трека. Попробуйте послушать больше музыки в Spotify."
            }
        
        # Анализируем характеристики
        total_valence = sum(track.get("valence", 0) for track in unique_tracks)
        total_energy = sum(track.get("energy", 0) for track in unique_tracks)
        total_danceability = sum(track.get("danceability", 0) for track in unique_tracks)
        total_tempo = sum(track.get("tempo", 0) for track in unique_tracks)
        
        track_count = len(unique_tracks)
        
        analysis = {
            "mood": {
                "valence": total_valence / track_count,  # Средняя позитивность
                "energy": total_energy / track_count,    # Средняя энергичность
                "danceability": total_danceability / track_count,  # Средняя танцевальность
                "tempo": total_tempo / track_count,      # Средний темп
            },
            "preferences": {
                "favorite_artists": list(set(track["artist"] for track in unique_tracks))[:10],
                "favorite_genres": [],  # Можно добавить анализ жанров
                "total_tracks_analyzed": track_count
            }
        }
        
        # Определяем общее настроение
        if analysis["mood"]["valence"] > 0.6:
            analysis["overall_mood"] = "Позитивное"
        elif analysis["mood"]["valence"] > 0.4:
            analysis["overall_mood"] = "Нейтральное"
        else:
            analysis["overall_mood"] = "Меланхоличное"
        
        print(f"✅ Analysis completed successfully")
        return analysis
            
    except Exception as e:
        print(f"❌ Error analyzing music taste: {str(e)}")
        return {"error": f"Ошибка при анализе музыкального вкуса: {str(e)}"}
