# 🎵 VibeMatch

VibeMatch - это современное веб-приложение для анализа музыкального вкуса и подбора музыки с помощью ИИ. Приложение анализирует ваши музыкальные предпочтения из Spotify и предлагает персонализированные рекомендации на основе анализа фото и видео.

## ✨ Возможности

### 🎼 Анализ музыкального вкуса
- Анализ ваших любимых треков и исполнителей
- Определение общего музыкального настроения
- Статистика по энергичности, позитивности и танцевальности
- Визуализация музыкальных предпочтений

### 🤖 ИИ-чат для анализа медиа
- Загрузка фото и видео для анализа настроения
- ИИ анализирует эмоции и атмосферу медиафайлов
- Автоматический подбор музыки под настроение
- Чат с ИИ-помощником для музыкальных рекомендаций

### 🎵 Интеграция со Spotify
- Безопасная авторизация через Spotify OAuth
- Доступ к вашим плейлистам и любимым трекам
- Создание персонализированных плейлистов

## 🚀 Быстрый старт

### Предварительные требования
- Node.js 18+ 
- Python 3.8+
- Spotify Developer Account
- OpenAI API Key
- ngrok (для HTTPS)

### 1. Клонирование и установка

```bash
git clone https://github.com/nazirasabyraly/nfac-project.git
cd nfac-project
chmod +x *.sh
./install.sh
```

### 2. Настройка переменных окружения

```bash
./setup_env.sh
```

Вам потребуется ввести:
- **Spotify Client ID** и **Client Secret** (из [Spotify Developer Dashboard](https://developer.spotify.com/dashboard))
- **OpenAI API Key** (из [OpenAI Platform](https://platform.openai.com/api-keys))
- **Frontend ngrok URL** (получите после запуска ngrok)

### 3. Настройка Spotify App

1. Перейдите в [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Создайте новое приложение
3. В настройках добавьте Redirect URI: `http://localhost:8001/auth/spotify/callback`
4. Скопируйте Client ID и Client Secret

### 4. Запуск приложения

```bash
./quick_start.sh
```

Или пошагово:

```bash
# Терминал 1: Запуск ngrok для фронтенда
./start_ngrok.sh

# Терминал 2: Запуск приложения
./start_app_improved.sh
```

### 5. Открытие приложения

Откройте ngrok URL фронтенда в браузере (например: `https://abc123.ngrok-free.app`)

## 📁 Структура проекта

```
VibeMatch/
├── frontend/                 # React приложение
│   ├── src/
│   │   ├── components/       # React компоненты
│   │   │   ├── Chat.tsx     # ИИ-чат компонент
│   │   │   └── Chat.css     # Стили чата
│   │   ├── pages/           # Страницы приложения
│   │   └── config.ts        # Конфигурация API
├── backend/                  # FastAPI сервер
│   ├── app/
│   │   ├── api/             # API endpoints
│   │   │   ├── auth.py      # Авторизация
│   │   │   ├── media.py     # Spotify API
│   │   │   ├── chat.py      # ИИ-чат API
│   │   │   └── recommend.py # Рекомендации
│   │   ├── services/        # Бизнес-логика
│   │   │   ├── spotify.py   # Spotify сервис
│   │   │   └── openai_service.py # OpenAI сервис
│   │   └── config.py        # Конфигурация
├── scripts/                  # Скрипты запуска
└── README.md
```

## 🔧 API Endpoints

### Авторизация
- `GET /auth/spotify/login` - Начало OAuth авторизации
- `GET /auth/spotify/callback` - Callback от Spotify

### Анализ музыки
- `GET /media/profile` - Профиль пользователя
- `GET /media/analysis` - Анализ музыкального вкуса
- `GET /media/top-tracks` - Топ треки пользователя

### ИИ-чат
- `POST /chat/analyze-media` - Анализ медиафайлов
- `POST /chat/get-recommendations` - Получение рекомендаций
- `POST /chat/chat` - Общий чат с ИИ
- `GET /chat/supported-formats` - Поддерживаемые форматы

## 🎨 User Stories

### Epic: Chat with AI for Vibe-Based Music Recommendations

**User Story 1: Анализ медиафайла с помощью ИИ**
- ✅ Загрузка фото/видео в чат
- ✅ Подключение OpenAI API для анализа
- ✅ Получение текстового описания эмоций

**User Story 2: Подбор треков из Spotify**
- ✅ Получение предпочтений пользователя
- ✅ Сопоставление эмоций с жанрами
- ✅ Формирование плейлиста рекомендаций

**User Story 3: Чат-интерфейс в Dashboard**
- ✅ Интеграция чата в dashboard
- ✅ Поддержка текста и медиафайлов
- ✅ Отображение ответов ИИ

**User Story 4: Исправление авторизации Spotify**
- ✅ OAuth flow с PKCE
- ✅ Безопасное хранение токенов
- ✅ Форма ввода email/пароля

## 🔒 Безопасность

- Использование OAuth 2.0 с PKCE для Spotify
- Безопасное хранение API ключей в .env файлах
- Валидация загружаемых файлов
- CORS настройки для ngrok доменов

## 🛠️ Технологии

### Frontend
- **React 18** с TypeScript
- **Vite** для сборки
- **CSS3** с градиентами и анимациями
- **Responsive Design** для мобильных устройств

### Backend
- **FastAPI** (Python)
- **OpenAI API** для анализа медиа
- **Spotify Web API** для музыкальных данных
- **Uvicorn** ASGI сервер

### Инфраструктура
- **ngrok** для HTTPS туннелей
- **Docker** (опционально)
- **Git** для версионирования

## 🚀 Развертывание

### Локальная разработка
```bash
# Установка зависимостей
npm install  # frontend
pip install -r backend/requirements.txt  # backend

# Запуск в режиме разработки
npm run dev  # frontend
uvicorn app.main:app --reload  # backend
```

### Продакшн
```bash
# Сборка фронтенда
npm run build

# Запуск бэкенда
uvicorn app.main:app --host 0.0.0.0 --port 8001
```

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📝 Лицензия

Этот проект лицензирован под MIT License - см. файл [LICENSE](LICENSE) для деталей.

## 🆘 Поддержка

Если у вас возникли проблемы:

1. Проверьте, что все переменные окружения настроены
2. Убедитесь, что ngrok URL актуален в Spotify Dashboard
3. Проверьте логи в консоли браузера и терминале
4. Создайте Issue в GitHub с описанием проблемы

## 🔮 Планы развития

- [ ] Интеграция с Instagram Stories
- [ ] Сравнение вкусов с друзьями
- [ ] Создание плейлистов под настроение
- [ ] Анализ аудио из видео
- [ ] Мобильное приложение
- [ ] Интеграция с Apple Music

---

**VibeMatch** - где музыка встречается с ИИ! 🎵✨ 