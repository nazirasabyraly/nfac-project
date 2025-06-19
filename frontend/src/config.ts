// src/config.ts

// Определяем базовый URL API в зависимости от окружения
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const ngrokUrl = localStorage.getItem('ngrok_backend_url');
    if (ngrokUrl) return ngrokUrl;
  }
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  return "https://429e-37-99-126-69.ngrok-free.app";
};

export const API_BASE_URL = getApiBaseUrl();

// Функция для обновления URL при получении ngrok ссылки
export const updateApiBaseUrl = (ngrokUrl: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('ngrok_backend_url', ngrokUrl);
    window.location.reload(); // Перезагружаем страницу для применения нового URL
  }
};
