from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    username: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: int
    created_at: datetime
    is_active: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class TokenData(BaseModel):
    username: Optional[str] = None

class SavedSongBase(BaseModel):
    youtube_video_id: str
    title: str
    artist: Optional[str] = None

class SavedSongCreate(SavedSongBase):
    pass

class SavedSong(SavedSongBase):
    id: int
    user_id: int
    date_saved: datetime

    class Config:
        from_attributes = True

class ChatMessageBase(BaseModel):
    role: str
    content: Optional[str] = None
    media_url: Optional[str] = None
    timestamp: Optional[datetime] = None

class ChatMessageCreate(ChatMessageBase):
    pass

class ChatMessageOut(ChatMessageBase):
    id: int
    class Config:
        orm_mode = True

class GenerateBeatRequest(BaseModel):
    prompt: str

class GenerateBeatResponse(BaseModel):
    success: bool
    audio_url: Optional[str] = None
    error: Optional[str] = None 