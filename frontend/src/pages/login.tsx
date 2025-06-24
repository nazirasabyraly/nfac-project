// src/pages/Login.tsx

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './login.css'
import { API_BASE_URL } from '../config'

const Login = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showManualLogin, setShowManualLogin] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)

  const handleSpotifyOAuth = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      // Прямой редирект на Spotify OAuth
      const scope = "user-top-read user-read-recently-played user-read-private user-read-email playlist-read-private user-library-read streaming user-modify-playback-state user-read-playback-state"
      const clientId = "a95c13aa064c44a4affeea5627147ca1" // Spotify Client ID
      const redirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI
      
      const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&show_dialog=true`
      
      window.location.href = authUrl
    } catch (error) {
      console.error('Error:', error)
      setError('Ошибка подключения к серверу')
      setIsLoading(false)
    }
  }

  const handleManualAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (!email || !password || (isRegistering && !username)) {
      setError('Пожалуйста, заполните все поля')
      setIsLoading(false)
      return
    }

    try {
      const endpoint = isRegistering ? '/users/register' : '/users/login'
      const requestData = isRegistering 
        ? { email, username, password }
        : { email, password }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })

      const data = await response.json()

      if (response.ok) {
        // Сохраняем токен и информацию о пользователе
        localStorage.setItem('auth_token', data.access_token)
        localStorage.setItem('user_info', JSON.stringify(data.user))
        
        // Перенаправляем на дашборд
        navigate('/dashboard')
      } else {
        setError(data.detail || 'Ошибка аутентификации')
      }
    } catch (error) {
      console.error('Error:', error)
      setError('Ошибка подключения к серверу')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>🎵 Aivi</h1>
          <p>Анализ музыкального вкуса и ИИ-помощник</p>
        </div>

        {!showManualLogin ? (
          <div className="login-options">
            <button
              onClick={handleSpotifyOAuth}
              disabled={isLoading}
              className="spotify-login-btn"
            >
              {isLoading ? '🔄 Подключение...' : '🎵 Войти через Spotify'}
            </button>
            <a
              href="https://accounts.spotify.com/logout"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#1DB954', marginTop: 10, display: 'inline-block', textAlign: 'center' }}
            >
              Выйти из Spotify (сменить аккаунт)
            </a>
            <button
              type="button"
              style={{ marginTop: 10, background: '#eee', color: '#333', border: '1px solid #ccc', borderRadius: 4, padding: '8px 12px', cursor: 'pointer', width: '100%' }}
              onClick={() => {
                // Очищаем localStorage
                localStorage.clear();
                // Очищаем cookies
                document.cookie.split(';').forEach(function(c) {
                  document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
                });
                // Перенаправляем на logout Spotify
                window.location.href = 'https://accounts.spotify.com/logout';
              }}
            >
              Выйти полностью (очистить все токены)
            </button>
            <div className="divider">
              <span>или</span>
            </div>
            
            <button
              onClick={() => setShowManualLogin(true)}
              className="manual-login-btn"
            >
              📧 Регистрация / Вход
            </button>
          </div>
        ) : (
          <form onSubmit={handleManualAuth} className="login-form">
            {isRegistering && (
              <div className="form-group">
                <label htmlFor="username">Имя пользователя</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Введите имя пользователя"
                  required
                />
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your-email@example.com"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Пароль</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                required
              />
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <div className="form-actions">
              <button
                type="submit"
                disabled={isLoading}
                className="login-submit-btn"
              >
                {isLoading ? '🔄 Обработка...' : (isRegistering ? 'Зарегистрироваться' : 'Войти')}
              </button>
              
              <button
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="toggle-btn"
              >
                {isRegistering ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
              </button>
              
              <button
                type="button"
                onClick={() => setShowManualLogin(false)}
                className="back-btn"
              >
                ← Назад
              </button>
            </div>
          </form>
        )}

        <div className="login-info">
          <h3>🚀 Что умеет Aivi?</h3>
          <ul>
            <li>📊 Анализ вашего музыкального вкуса</li>
            <li>🤖 ИИ-чат для анализа фото/видео</li>
            <li>🎵 Подбор музыки под ваш контент</li>
            <li>📱 Современный интерфейс</li>
            <li>🔐 Безопасная регистрация и вход</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Login
