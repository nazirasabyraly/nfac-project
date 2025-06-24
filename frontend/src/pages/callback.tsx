// src/pages/Callback.tsx

import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config'

const Callback = () => {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('🔍 Callback page loaded')
    console.log('📍 Current URL:', window.location.href)
    
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const errorParam = params.get('error')
    const state = params.get('state')

    console.log('📋 URL Parameters:')
    console.log('- code:', code ? 'present' : 'missing')
    console.log('- error:', errorParam)
    console.log('- state:', state)
    console.log('- all params:', Object.fromEntries(params.entries()))

    if (errorParam) {
      setError('Доступ к Spotify не был предоставлен. Пожалуйста, попробуйте снова и подтвердите все права.')
      return
    }

    if (code) {
      // Проверяем, не был ли этот код уже обработан
      const processedCodes = JSON.parse(sessionStorage.getItem('processed_codes') || '[]')
      if (processedCodes.includes(code)) {
        console.log('⚠️ Code already processed, skipping...')
        return
      }

      console.log('🔄 Exchanging code for token...')
      console.log('🌐 API URL:', `${API_BASE_URL}/auth/spotify/callback?code=${code}`)
      
      // Отмечаем код как обработанный
      processedCodes.push(code)
      sessionStorage.setItem('processed_codes', JSON.stringify(processedCodes))
      
      // Отправляем код на backend для обмена на токен
      fetch(`${API_BASE_URL}/auth/spotify/token?code=${code}`)
        .then(response => {
          console.log('📡 Response status:', response.status)
          console.log('📡 Response headers:', response.headers)
          
          if (response.ok) {
            return response.json()
          }
          return response.text().then(text => {
            setError('Ошибка авторизации Spotify. Пожалуйста, попробуйте снова.')
            throw new Error(`HTTP ${response.status}: ${text}`)
          })
        })
        .then(data => {
          console.log('✅ Token data received:', data)
          
          if (data.access_token) {
            localStorage.setItem('spotify_token', data.access_token)
            console.log('💾 Token saved to localStorage')
            navigate('/dashboard')
          } else {
            setError('Токен не получен. Попробуйте снова.')
            throw new Error('Токен не получен')
          }
        })
        .catch(error => {
          console.error('❌ Fetch error:', error)
          // setError('Ошибка авторизации Spotify. Попробуйте войти снова.')
        })
    } else {
      console.error('❌ No code parameter found')
      alert('Код авторизации не получен. Проверьте настройки Spotify App.')
      navigate('/')
    }
  }, [navigate])

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <h2>Ошибка авторизации Spotify</h2>
        <p>{error}</p>
        <button
          style={{ marginTop: 24, padding: '12px 32px', fontSize: 18, borderRadius: 8, background: '#1DB954', color: '#fff', border: 'none', cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          Попробовать снова
        </button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <h2>Завершаем авторизацию Spotify...</h2>
      <p>Пожалуйста, подождите ⏳</p>
    </div>
  )
}

export default Callback
