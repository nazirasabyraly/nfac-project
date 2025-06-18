from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from typing import Dict, Any, List
import json
from ..services.openai_service import OpenAIService
from ..config import MAX_FILE_SIZE, ALLOWED_EXTENSIONS

router = APIRouter(prefix="/api/chat", tags=["chat"])

# Инициализируем сервисы
openai_service = OpenAIService()

@router.post("/analyze-media")
async def analyze_media(
    file: UploadFile = File(...),
    user_id: str = None
):
    """
    Анализирует загруженный медиафайл и возвращает анализ настроения
    """
    try:
        # Проверяем размер файла
        if file.size and file.size > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="Файл слишком большой (максимум 10MB)")
        
        # Проверяем расширение файла
        if file.filename:
            file_ext = '.' + file.filename.split('.')[-1].lower()
            if file_ext not in ALLOWED_EXTENSIONS:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Неподдерживаемый тип файла. Разрешены: {', '.join(ALLOWED_EXTENSIONS)}"
                )
        
        # Анализируем медиафайл
        analysis = await openai_service.analyze_media_mood(file)
        
        if "error" in analysis:
            raise HTTPException(status_code=500, detail=analysis["error"])
        
        return JSONResponse(content=analysis)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка анализа файла: {str(e)}")

@router.post("/get-recommendations")
async def get_music_recommendations(
    mood_analysis: Dict[str, Any],
    user_id: str = None
):
    """
    Получает рекомендации музыки на основе анализа настроения
    """
    try:
        # Получаем предпочтения пользователя из Spotify
        user_preferences = {}
        
        if user_id:
            # Здесь можно добавить получение предпочтений из базы данных
            # Пока используем базовые предпочтения
            user_preferences = {
                "top_genres": ["pop", "electronic", "indie"],
                "top_artists": ["The Weeknd", "Dua Lipa", "Post Malone"],
                "top_tracks": ["Blinding Lights", "Levitating", "Circles"]
            }
        
        # Получаем рекомендации от ИИ
        recommendations = await openai_service.get_music_recommendations(
            mood_analysis, 
            user_preferences
        )
        
        return JSONResponse(content=recommendations)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения рекомендаций: {str(e)}")

@router.post("/chat")
async def chat_with_ai(
    message: str,
    mood_analysis: Dict[str, Any] = None,
    user_id: str = None
):
    """
    Общий чат с ИИ для обсуждения музыки и настроения
    """
    try:
        # Формируем контекст для ИИ
        context = f"""
        Ты музыкальный эксперт и помощник по подбору музыки. 
        Пользователь написал: "{message}"
        """
        
        if mood_analysis:
            context += f"""
            Контекст анализа настроения:
            - Настроение: {mood_analysis.get('mood', 'neutral')}
            - Описание: {mood_analysis.get('description', '')}
            - Эмоции: {mood_analysis.get('emotions', [])}
            """
        
        context += """
        Ответь дружелюбно и помоги пользователю с музыкальными рекомендациями.
        Можешь предложить жанры, исполнителей или обсудить музыкальные предпочтения.
        """
        
        # Получаем ответ от ИИ
        response = openai_service.client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "Ты дружелюбный музыкальный эксперт, который помогает людям находить музыку по настроению."},
                {"role": "user", "content": context}
            ],
            max_tokens=300
        )
        
        ai_response = response.choices[0].message.content
        
        return JSONResponse(content={
            "success": True,
            "response": ai_response,
            "message": message
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка чата: {str(e)}")

@router.get("/supported-formats")
async def get_supported_formats():
    """
    Возвращает поддерживаемые форматы файлов
    """
    return JSONResponse(content={
        "supported_formats": list(ALLOWED_EXTENSIONS),
        "max_file_size_mb": MAX_FILE_SIZE // (1024 * 1024)
    }) 