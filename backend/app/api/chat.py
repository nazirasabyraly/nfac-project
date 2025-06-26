from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from typing import Dict, Any, List
import json
from ..services.openai_service import OpenAIService
from ..config import MAX_FILE_SIZE, ALLOWED_EXTENSIONS
from ..dependencies import get_current_user
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import SavedSong, User, ChatMessage
from ..schemas import ChatMessageCreate, ChatMessageOut
import asyncio

router = APIRouter(tags=["chat"])

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
        print(f"🔍 Получен файл: {file.filename}, размер: {file.size}, тип: {file.content_type}")
        
        # Проверяем размер файла
        if file.size and file.size > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="Файл слишком большой (максимум 10MB)")
        
        # Проверяем расширение файла
        if file.filename:
            file_ext = '.' + file.filename.split('.')[-1].lower()
            print(f"📁 Расширение файла: {file_ext}")
            print(f"✅ Разрешенные расширения: {ALLOWED_EXTENSIONS}")
            
            if file_ext not in ALLOWED_EXTENSIONS:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Неподдерживаемый тип файла. Разрешены: {', '.join(ALLOWED_EXTENSIONS)}"
                )
        
        print("🚀 Начинаем анализ медиафайла...")
        
        # Анализируем медиафайл
        analysis = await openai_service.analyze_media_mood(file)
        
        print(f"📊 Результат анализа: {analysis}")
        
        if "error" in analysis:
            raise HTTPException(status_code=500, detail=analysis["error"])
        
        return JSONResponse(content=analysis)
        
    except Exception as e:
        print(f"❌ Ошибка в analyze_media: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ошибка анализа файла: {str(e)}")

@router.post("/get-recommendations")
async def get_music_recommendations(
    mood_analysis: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Получает две подборки: 5 персональных (по saved_songs) и 5 глобальных (по mood_analysis)
    """
    try:
        global_prefs = {
            "top_genres": ["pop", "electronic", "indie"],
            "top_artists": ["The Weeknd", "Dua Lipa", "Post Malone"],
            "top_tracks": ["Blinding Lights", "Levitating", "Circles"]
        }
        saved_songs = db.query(SavedSong).filter(SavedSong.user_id == current_user.id).all()
        personal_prefs = {
            "top_genres": [],
            "top_artists": list({s.artist for s in saved_songs if s.artist}),
            "top_tracks": list({s.title for s in saved_songs if s.title})
        } if saved_songs else global_prefs
        # PROMPT: просим ровно 5 треков
        try:
            global_task = openai_service.get_music_recommendations(mood_analysis, global_prefs, n_tracks=5)
            personal_task = openai_service.get_music_recommendations(mood_analysis, personal_prefs, n_tracks=5)
            global_rec, personal_rec = await asyncio.wait_for(
                asyncio.gather(global_task, personal_task), timeout=40.0
            )
        except asyncio.TimeoutError:
            return JSONResponse(status_code=504, content={"error": "AI recommendations timeout. Попробуйте ещё раз."})
        return JSONResponse(content={
            "global": global_rec["recommendations"],
            "personal": personal_rec["recommendations"]
        })
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

@router.get('/history', response_model=List[ChatMessageOut])
def get_chat_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id).order_by(ChatMessage.timestamp).all()

@router.post('/history', response_model=ChatMessageOut)
def add_chat_message(msg: ChatMessageCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_msg = ChatMessage(user_id=current_user.id, **msg.dict())
    db.add(db_msg)
    db.commit()
    db.refresh(db_msg)
    return db_msg 