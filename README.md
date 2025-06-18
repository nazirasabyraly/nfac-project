# VibeMatch

Приложение для поиска музыкальных совпадений через Spotify API.

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
./install.sh
```

### 2. Настройка Spotify API

```bash
./setup_env.sh
```

Этот скрипт поможет вам:
- Создать файл `backend/.env`
- Настроить Spotify API credentials
- Настроить frontend ngrok URL

### 3. Запуск приложения

```bash
./start_app_improved.sh
```

### 4. Запуск ngrok (для Spotify API)

```bash
./start_ngrok.sh
```

### 5. Настройка URL

После запуска ngrok:

1. Скопируйте HTTPS URL для фронтенда
2. Откройте этот URL в браузере для работы приложения
3. Backend работает на localhost:8001, frontend общается с ним напрямую
4. В настройках Spotify App redirect URI: `http://localhost:8001/auth/spotify/callback`

## 📁 Структура проекта

```
VibeMatch/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── services/
│   │   ├── config.py
│   │   └── main.py
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── install.sh
├── setup_env.sh
├── start_app.sh
├── start_app_improved.sh
├── start_ngrok.sh
└── README.md
```

## 🔧 API Endpoints

- `GET /auth/ngrok-url` - Получить текущий URL бэкенда
- `GET /auth/spotify/login` - Начать авторизацию Spotify
- `GET /auth/spotify/callback` - Callback для Spotify OAuth
- `GET /media/...` - Медиа endpoints
- `GET /recommend/...` - Рекомендации

## 🛠️ Устранение неполадок

### Проблемы с запуском
- Используйте `./start_app_improved.sh` для автоматического решения проблем с портами
- Убедитесь, что Python 3 установлен: `python3 --version`
- Проверьте, что npm установлен: `npm --version`

### CORS ошибки
- Убедитесь, что ngrok URL добавлен в CORS настройки (используется allow_origin_regex)
- Проверьте, что используется HTTPS для ngrok

### Spotify авторизация
- Проверьте правильность `SPOTIFY_REDIRECT_URI`
- Убедитесь, что URL добавлен в настройки Spotify App

### Проблемы с ngrok
- Проверьте логи в папке `logs/`
- Убедитесь, что порт 3000 свободен
- Перезапустите туннель при необходимости

## 📝 Логи

- ngrok логи: `logs/frontend_ngrok.log`
- Backend логи: в терминале где запущен uvicorn
- Frontend логи: в терминале где запущен npm

## 🔒 Безопасность

- Никогда не коммитьте `.env` файлы
- Используйте HTTPS для ngrok в продакшене
- Ограничьте CORS origins в продакшене

## 🎯 Полезные команды

```bash
# Проверить занятые порты
lsof -ti:3000
lsof -ti:8001

# Остановить процессы на портах
kill $(lsof -ti:3000)
kill $(lsof -ti:8001)

# Проверить статус приложения
curl http://localhost:8001/docs
curl http://localhost:3000
``` 