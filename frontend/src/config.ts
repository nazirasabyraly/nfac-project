// src/config.ts

// Принудительно очищаем старый URL из localStorage
if (typeof window !== 'undefined') {
  localStorage.removeItem('ngrok_backend_url');
}

// Определяем базовый URL API в зависимости от окружения
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const ngrokUrl = localStorage.getItem('ngrok_backend_url');
    if (ngrokUrl) return ngrokUrl;
  }
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  return "http://localhost:8001";
};

export const API_BASE_URL = getApiBaseUrl();

// Функция для обновления URL при получении ngrok ссылки
export const updateApiBaseUrl = (ngrokUrl: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('ngrok_backend_url', ngrokUrl);
    window.location.reload(); // Перезагружаем страницу для применения нового URL
  }
};
