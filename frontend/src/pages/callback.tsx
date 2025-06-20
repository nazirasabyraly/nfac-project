// src/pages/Callback.tsx

import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config'

const Callback = () => {
  const navigate = useNavigate()

  useEffect(() => {
    console.log('🔍 Callback page loaded')
    console.log('📍 Current URL:', window.location.href)
    
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const error = params.get('error')
    const state = params.get('state')

    console.log('📋 URL Parameters:')
    console.log('- code:', code ? 'present' : 'missing')
    console.log('- error:', error)
    console.log('- state:', state)
    console.log('- all params:', Object.fromEntries(params.entries()))

    if (error) {
      console.error('❌ Spotify error:', error)
      alert(`Ошибка авторизации: ${error}`)
      navigate('/')
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
      fetch(`${API_BASE_URL}/auth/spotify/callback?code=${code}`)
        .then(response => {
          console.log('📡 Response status:', response.status)
          console.log('📡 Response headers:', response.headers)
          
          if (response.ok) {
            return response.json()
          }
          return response.text().then(text => {
            console.error('❌ Response text:', text)
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
            console.error('❌ No access_token in response:', data)
            throw new Error('Токен не получен')
          }
        })
        .catch(error => {
          console.error('❌ Fetch error:', error)
          alert(`Не удалось получить токен: ${error.message}`)
          navigate('/')
        })
    } else {
      console.error('❌ No code parameter found')
      alert('Код авторизации не получен. Проверьте настройки Spotify App.')
      navigate('/')
    }
  }, [navigate])

  return (
    <div style={{ textAlign: 'center', marginTop: '20%' }}>
      <h2>Авторизация...</h2>
      <p>Подключаем Spotify. Подождите ⏳</p>
      <p style={{ fontSize: '12px', color: '#666' }}>
        Откройте консоль разработчика (F12) для отладки
      </p>
    </div>
  )
}

export default Callback
