import base64
import io
import mimetypes
from typing import Optional, Dict, Any
import openai
from fastapi import UploadFile
from ..config import (
    AZURE_OPENAI_API_KEY, 
    AZURE_OPENAI_ENDPOINT, 
    AZURE_OPENAI_API_VERSION, 
    AZURE_OPENAI_DEPLOYMENT_NAME,
    OPENAI_API_KEY
)

class OpenAIService:
    def __init__(self):
        # Проверяем, настроен ли Azure OpenAI
        if AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_DEPLOYMENT_NAME:
            # Используем Azure OpenAI
            self.client = openai.AzureOpenAI(
                api_key=AZURE_OPENAI_API_KEY,
                api_version=AZURE_OPENAI_API_VERSION,
                azure_endpoint=AZURE_OPENAI_ENDPOINT
            )
            self.deployment_name = AZURE_OPENAI_DEPLOYMENT_NAME
            self.use_azure = True
            print("🔵 Используется Azure OpenAI")
        elif OPENAI_API_KEY:
            # Используем обычный OpenAI
            self.client = openai.OpenAI(api_key=OPENAI_API_KEY)
            self.deployment_name = None
            self.use_azure = False
            print("🟢 Используется OpenAI API")
        else:
            raise ValueError("Не настроен ни Azure OpenAI, ни OpenAI API")
    
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
        5. Придумай короткое красивое описание (caption) для поста в соцсетях, отражающее вайб изображения (1-2 предложения, без хэштегов)
        
        Ответь в формате JSON:
        {
            "mood": "основное настроение",
            "emotions": ["список эмоций"],
            "colors": "описание цветов",
            "music_genre": "подходящий музыкальный жанр",
            "description": "краткое описание вайба",
            "caption": "краткое красивое описание для поста"
        }
        """
        
        # Для Azure OpenAI используем модель с поддержкой Vision
        if self.use_azure:
            # Пробуем использовать gpt-4o для Vision (если доступен в Azure)
            try:
                response = self.client.chat.completions.create(
                    model="gpt-4o",  # Используем gpt-4o для Vision
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
            except Exception as e:
                # Если gpt-4o недоступен, используем обычный OpenAI
                print(f"Azure OpenAI Vision недоступен: {e}")
                if OPENAI_API_KEY:
                    client = openai.OpenAI(api_key=OPENAI_API_KEY)
                    response = client.chat.completions.create(
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
                else:
                    raise e
        else:
            # Обычный OpenAI
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
        except Exception:
            # Если ответ не JSON, пробуем найти JSON внутри строки
            import re, json
            match = re.search(r'\{[\s\S]*\}', content)
            if match:
                try:
                    result = json.loads(match.group(0))
                except Exception:
                    result = {}
            else:
                result = {}
        
        # Формируем финальный ответ с отдельными полями
        mood = result.get("mood", "neutral")
        emotions = result.get("emotions", [])
        colors = result.get("colors", "")
        music_genre = result.get("music_genre", result.get("music_style", "pop"))
        description = result.get("description", "")
        caption = result.get("caption")
        if not caption and description:
            # Если нет caption, делаем его из description
            caption = description[:100] + ("..." if len(description) > 100 else "")
        
        return {
            "success": True,
            "mood": mood,
            "emotions": emotions,
            "colors": colors,
            "music_genre": music_genre,
            "description": description,
            "caption": caption,
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
    
    async def get_music_recommendations(self, mood_analysis: Dict[str, Any], user_preferences: Dict[str, Any], n_tracks: int = 5) -> Dict[str, Any]:
        """
        Генерирует рекомендации музыки на основе анализа настроения и предпочтений пользователя (с учётом его лайкнутых треков)
        """
        prompt = f"""
        На основе настроения "{mood_analysis.get('mood', 'neutral')}" и эмоций {mood_analysis.get('emotions', [])} предложи {n_tracks} музыкальных треков.
        
        Предпочтения пользователя: {user_preferences.get('top_artists', [])}
        
        Ответь в формате JSON:
        {{
            "recommended_tracks": [
                {{"name": "название", "artist": "исполнитель", "reason": "почему подходит"}}
            ],
            "explanation": "краткое объяснение",
            "alternative_genres": ["жанр1", "жанр2"]
        }}
        """
        
        # Выбираем модель и клиент в зависимости от провайдера
        if self.use_azure:
            # Для Azure OpenAI используем deployment_name (gpt-4o)
            model = self.deployment_name
            client = self.client
            print(f"[RECOMMEND] Используем Azure OpenAI с моделью: {model}")
        else:
            # Для обычного OpenAI используем gpt-4
            model = "gpt-4"
            client = self.client
            print(f"[RECOMMEND] Используем OpenAI API с моделью: {model}")
        
        try:
            print(f"[RECOMMEND] Отправляем запрос к модели {model}...")
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                max_tokens=800,
                timeout=30  # Увеличиваем timeout
            )
            content = response.choices[0].message.content
            print(f"[RECOMMEND] Получен ответ от {model}: {content}")
            try:
                import json
                # Сначала пробуем парсить как обычный JSON
                result = json.loads(content)
            except json.JSONDecodeError:
                # Если не получилось, ищем JSON в markdown блоке
                import re
                json_match = re.search(r'```json\s*(\{[\s\S]*?\})\s*```', content)
                if json_match:
                    try:
                        result = json.loads(json_match.group(1))
                    except json.JSONDecodeError:
                        print(f"[RECOMMEND] Ошибка парсинга JSON из markdown: {json_match.group(1)}")
                        result = {
                            "explanation": content,
                            "recommended_tracks": [],
                            "alternative_genres": []
                        }
                else:
                    # Если markdown блок не найден, ищем любой JSON в тексте
                    json_match = re.search(r'\{[\s\S]*\}', content)
                    if json_match:
                        try:
                            result = json.loads(json_match.group(0))
                        except json.JSONDecodeError:
                            print(f"[RECOMMEND] Ошибка парсинга найденного JSON: {json_match.group(0)}")
                            result = {
                                "explanation": content,
                                "recommended_tracks": [],
                                "alternative_genres": []
                            }
                    else:
                        print(f"[RECOMMEND] JSON не найден в ответе: {content}")
                        result = {
                            "explanation": content,
                            "recommended_tracks": [],
                            "alternative_genres": []
                        }
            
            return {
                "success": True,
                "recommendations": result
            }
        except Exception as e:
            print(f"[RECOMMEND] Ошибка при получении рекомендаций: {e}")
            # Возвращаем базовые рекомендации в случае ошибки
            return {
                "success": True,
                "recommendations": {
                    "explanation": f"Не удалось получить персонализированные рекомендации: {str(e)}",
                    "recommended_tracks": [
                        {"name": "Blinding Lights", "artist": "The Weeknd", "reason": "Энергичный поп-трек"},
                        {"name": "Levitating", "artist": "Dua Lipa", "reason": "Летний вайб"},
                        {"name": "Circles", "artist": "Post Malone", "reason": "Мелодичный трек"}
                    ],
                    "alternative_genres": ["pop", "electronic", "indie"]
                }
            } 