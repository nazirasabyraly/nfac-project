// src/pages/Login.tsx

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './login.css'
import { API_BASE_URL } from '../config'

const Login = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showManualLogin, setShowManualLogin] = useState(false)

  const handleSpotifyOAuth = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      // Прямой редирект на Spotify OAuth
      const scope = "user-top-read user-read-recently-played user-read-private user-read-email playlist-read-private user-library-read"
      const clientId = "a95c13aa064c44a4affeea5627147ca1" // Spotify Client ID
      const redirectUri = "https://9a9d-95-56-238-194.ngrok-free.app/callback"
      
      const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`
      
      window.location.href = authUrl
    } catch (error) {
      console.error('Error:', error)
      setError('Ошибка подключения к серверу')
      setIsLoading(false)
    }
  }

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (!email || !password) {
      setError('Пожалуйста, заполните все поля')
      setIsLoading(false)
      return
    }

    try {
      // Для ручного входа тоже используем Spotify OAuth
      // (Spotify не поддерживает прямую авторизацию через email/password)
      const scope = "user-top-read user-read-recently-played user-read-private user-read-email playlist-read-private user-library-read"
      const clientId = "a95c13aa064c44a4affeea5627147ca1"
      const redirectUri = "https://9a9d-95-56-238-194.ngrok-free.app/callback"
      
      const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`
      
      window.location.href = authUrl
    } catch (error) {
      console.error('Error:', error)
      setError('Ошибка подключения к серверу')
      setIsLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>🎵 VibeMatch</h1>
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
            
            <div className="divider">
              <span>или</span>
            </div>
            
            <button
              onClick={() => setShowManualLogin(true)}
              className="manual-login-btn"
            >
              📧 Ввести email и пароль
            </button>
          </div>
        ) : (
          <form onSubmit={handleManualLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email Spotify</label>
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
              <label htmlFor="password">Пароль Spotify</label>
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
                {isLoading ? '🔄 Вход...' : 'Войти'}
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
          <h3>🚀 Что умеет VibeMatch?</h3>
          <ul>
            <li>📊 Анализ вашего музыкального вкуса</li>
            <li>🤖 ИИ-чат для анализа фото/видео</li>
            <li>🎵 Подбор музыки под настроение</li>
            <li>📱 Современный интерфейс</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Login
