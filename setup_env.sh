#!/bin/bash

echo "🔧 Настройка переменных окружения..."

# Проверяем, существует ли .env файл
if [ ! -f "backend/.env" ]; then
    echo "📝 Создание .env файла..."
    touch backend/.env
fi

echo ""
echo "📋 Введите данные для Spotify API:"
echo ""

# Запрашиваем данные у пользователя
read -p "Spotify Client ID: " spotify_client_id
read -p "Spotify Client Secret: " spotify_client_secret

echo ""
echo "🌐 Введите frontend ngrok URL (например: https://def456.ngrok-free.app):"
read -p "Frontend ngrok URL: " frontend_ngrok_url

# Устанавливаем значения по умолчанию
if [ -z "$frontend_ngrok_url" ]; then
    frontend_ngrok_url="http://localhost:3000"
fi

# Backend всегда localhost
backend_url="http://localhost:8001"

# Формируем redirect URI
spotify_redirect_uri="${backend_url}/auth/spotify/callback"

# Записываем в .env файл
cat > backend/.env << EOF
# Spotify API credentials
SPOTIFY_CLIENT_ID=$spotify_client_id
SPOTIFY_CLIENT_SECRET=$spotify_client_secret

# Redirect URIs
SPOTIFY_REDIRECT_URI=$spotify_redirect_uri
FRONTEND_URL=$frontend_ngrok_url

# Backend settings
HOST=0.0.0.0
PORT=8001
EOF

echo ""
echo "✅ .env файл создан!"
echo ""
echo "📝 Содержимое файла:"
echo "=================="
cat backend/.env
echo "=================="
echo ""
echo "🔗 Не забудьте добавить этот URL в настройки Spotify App:"
echo "   $spotify_redirect_uri"
echo ""
echo "🚀 Теперь можете запустить приложение:"
echo "   ./start_app_improved.sh" 