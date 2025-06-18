# backend/app/config.py

import os
from dotenv import load_dotenv

load_dotenv()

# Spotify credentials
SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
SPOTIFY_REDIRECT_URI = os.getenv("SPOTIFY_REDIRECT_URI")

# OpenAI credentials
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Frontend URL
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Backend settings
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8001"))

# File upload settings
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.mp4', '.mov', '.avi'}

# Проверяем обязательные переменные
if not SPOTIFY_CLIENT_ID:
    print("⚠️  SPOTIFY_CLIENT_ID не установлен в .env файле")
if not SPOTIFY_CLIENT_SECRET:
    print("⚠️  SPOTIFY_CLIENT_SECRET не установлен в .env файле")
if not SPOTIFY_REDIRECT_URI:
    print("⚠️  SPOTIFY_REDIRECT_URI не установлен в .env файле")
if not OPENAI_API_KEY:
    print("⚠️  OPENAI_API_KEY не установлен в .env файле")
