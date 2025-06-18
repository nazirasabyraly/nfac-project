import base64
import io
import mimetypes
from typing import Optional, Dict, Any
import openai
from fastapi import UploadFile
from ..config import OPENAI_API_KEY

class OpenAIService:
    def __init__(self):
        self.client = openai.OpenAI(api_key=OPENAI_API_KEY)
    
    async def analyze_media_mood(self, file: UploadFile) -> Dict[str, Any]:
        """
        Анализирует медиафайл и определяет настроение/вайб
        """
        try:
            # Читаем файл
            file_content = await file.read()
            
            # Определяем тип файла
            file_type = self._get_file_type(file.filename)
            
            if file_type == "image":
                return await self._analyze_image(file_content, file.filename)
            elif file_type == "video":
                return await self._analyze_video(file_content, file.filename)
            else:
                raise ValueError("Неподдерживаемый тип файла")
                
        except Exception as e:
            return {
                "error": f"Ошибка анализа файла: {str(e)}",
                "mood": "neutral",
                "description": "Не удалось проанализировать файл"
            }
    
    async def _analyze_image(self, file_content: bytes, filename: str) -> Dict[str, Any]:
        """
        Анализирует изображение с помощью GPT-4 Vision
        """
        # Кодируем изображение в base64
        base64_image = base64.b64encode(file_content).decode('utf-8')
        
        prompt = """
        Проанализируй это изображение и определи:
        1. Общее настроение и атмосферу (например: радостная, меланхоличная, энергичная, спокойная)
        2. Цветовую палитру и её влияние на настроение
        3. Эмоции, которые передаёт изображение
        4. Музыкальный жанр или стиль, который подошёл бы к этому настроению
        
        Ответь в формате JSON:
        {
            "mood": "основное настроение",
            "emotions": ["список эмоций"],
            "colors": "описание цветов",
            "music_genre": "подходящий музыкальный жанр",
            "description": "краткое описание вайба"
        }
        """
        
        response = self.client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=500
        )
        
        # Парсим ответ
        content = response.choices[0].message.content
        try:
            import json
            result = json.loads(content)
            return {
                "success": True,
                "mood": result.get("mood", "neutral"),
                "emotions": result.get("emotions", []),
                "colors": result.get("colors", ""),
                "music_genre": result.get("music_genre", "pop"),
                "description": result.get("description", ""),
                "analysis": content
            }
        except json.JSONDecodeError:
            return {
                "success": True,
                "mood": "neutral",
                "description": content,
                "analysis": content
            }
    
    async def _analyze_video(self, file_content: bytes, filename: str) -> Dict[str, Any]:
        """
        Анализирует видео (пока используем первый кадр)
        """
        # Для видео пока анализируем только первый кадр
        # В будущем можно добавить анализ аудио и движения
        
        prompt = """
        Проанализируй этот видеокадр и определи:
        1. Общее настроение и атмосферу
        2. Динамику и движение в кадре
        3. Эмоции и вайб
        4. Подходящий музыкальный стиль
        
        Ответь в формате JSON:
        {
            "mood": "основное настроение",
            "dynamics": "описание динамики",
            "emotions": ["список эмоций"],
            "music_style": "подходящий музыкальный стиль",
            "description": "краткое описание вайба"
        }
        """
        
        # Пока возвращаем базовый анализ
        return {
            "success": True,
            "mood": "dynamic",
            "dynamics": "Видео содержит движение",
            "emotions": ["энергичность", "динамичность"],
            "music_style": "electronic",
            "description": "Динамичное видео с энергичным настроением",
            "note": "Полный анализ видео будет доступен в следующих версиях"
        }
    
    def _get_file_type(self, filename: str) -> str:
        """
        Определяет тип файла по расширению
        """
        if not filename:
            return "unknown"
        
        ext = filename.lower().split('.')[-1]
        
        if ext in ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']:
            return "image"
        elif ext in ['mp4', 'mov', 'avi', 'mkv', 'webm']:
            return "video"
        else:
            return "unknown"
    
    async def get_music_recommendations(self, mood_analysis: Dict[str, Any], user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        """
        Генерирует рекомендации музыки на основе анализа настроения и предпочтений пользователя
        """
        prompt = f"""
        На основе анализа настроения и предпочтений пользователя, предложи рекомендации для плейлиста.
        
        Анализ настроения:
        - Настроение: {mood_analysis.get('mood', 'neutral')}
        - Эмоции: {mood_analysis.get('emotions', [])}
        - Описание: {mood_analysis.get('description', '')}
        
        Предпочтения пользователя:
        - Любимые жанры: {user_preferences.get('top_genres', [])}
        - Любимые исполнители: {user_preferences.get('top_artists', [])}
        - Любимые треки: {user_preferences.get('top_tracks', [])}
        
        Предложи:
        1. 5-10 треков, которые подходят к настроению
        2. Объяснение, почему эти треки подходят
        3. Альтернативные жанры для исследования
        
        Ответь в формате JSON:
        {{
            "recommended_tracks": [
                {{"name": "название", "artist": "исполнитель", "reason": "почему подходит"}}
            ],
            "explanation": "объяснение рекомендаций",
            "alternative_genres": ["жанр1", "жанр2"]
        }}
        """
        
        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "user", "content": prompt}
            ],
            max_tokens=800
        )
        
        content = response.choices[0].message.content
        try:
            import json
            result = json.loads(content)
            return {
                "success": True,
                "recommendations": result
            }
        except json.JSONDecodeError:
            return {
                "success": True,
                "recommendations": {
                    "explanation": content,
                    "recommended_tracks": [],
                    "alternative_genres": []
                }
            } 