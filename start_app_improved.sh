#!/bin/bash

echo "🚀 Запуск VibeMatch приложения..."

# Проверяем, что мы в корневой папке проекта
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Запустите скрипт из корневой папки проекта"
    exit 1
fi

# Функция для проверки и освобождения порта
check_and_free_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pids" ]; then
        echo "⚠️  Порт $port занят. Останавливаю процессы..."
        echo "$pids" | xargs kill -9 2>/dev/null
        sleep 2
    fi
}

# Функция для очистки при выходе
cleanup() {
    echo ""
    echo "🛑 Остановка приложения..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Перехватываем сигнал для корректного завершения
trap cleanup SIGINT SIGTERM

# Проверяем и освобождаем порты
echo "🔍 Проверка портов..."
check_and_free_port 8001
check_and_free_port 3000

# Запускаем бэкенд
echo "🔧 Запуск бэкенда..."
cd backend
if command -v python3 &> /dev/null; then
    python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload &
elif command -v python &> /dev/null; then
    python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload &
else
    echo "❌ Python не установлен"
    exit 1
fi
BACKEND_PID=$!
cd ..

# Ждем запуска бэкенда
echo "⏳ Ожидание запуска бэкенда..."
sleep 5

# Проверяем, что бэкенд запустился
if ! curl -s http://localhost:8001/docs > /dev/null; then
    echo "❌ Бэкенд не запустился"
    exit 1
fi
echo "✅ Бэкенд запущен на http://localhost:8001"

# Запускаем фронтенд
echo "🎨 Запуск фронтенда..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Ждем запуска фронтенда
echo "⏳ Ожидание запуска фронтенда..."
sleep 5

# Проверяем, что фронтенд запустился
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Фронтенд не запустился"
    exit 1
fi
echo "✅ Фронтенд запущен на http://localhost:3000"

echo ""
echo "🎉 Приложение успешно запущено!"
echo "🔧 Бэкенд: http://localhost:8001"
echo "🎨 Фронтенд: http://localhost:3000"
echo "📚 API документация: http://localhost:8001/docs"
echo ""
echo "Для остановки нажмите Ctrl+C"

# Ждем завершения
wait 