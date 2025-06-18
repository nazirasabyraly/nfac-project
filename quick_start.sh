#!/bin/bash

echo "🎉 Добро пожаловать в VibeMatch!"
echo "=================================="
echo ""

# Проверяем, что мы в корневой папке проекта
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Запустите скрипт из корневой папки проекта"
    exit 1
fi

# Проверяем наличие .env файла
if [ ! -f "backend/.env" ]; then
    echo "📝 Файл .env не найден. Запускаем настройку..."
    ./setup_env.sh
    echo ""
fi

# Проверяем, что зависимости установлены
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Устанавливаем зависимости..."
    ./install.sh
    echo ""
fi

# Останавливаем существующие процессы
echo "🛑 Останавливаем существующие процессы..."
kill $(lsof -ti:3000) 2>/dev/null
kill $(lsof -ti:8001) 2>/dev/null
sleep 2

# Запускаем приложение
echo "🚀 Запускаем приложение..."
./start_app_improved.sh 