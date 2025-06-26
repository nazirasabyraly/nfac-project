import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config'
import Chat from '../components/Chat'
import { useTranslation } from 'react-i18next'
import Recommendations from '../components/Recommendations'
import Favorites from '../components/Favorites'

const Dashboard = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'chat' | 'recommendations' | 'favorites'>('chat')

  useEffect(() => {
    // Проверяем только email/пароль авторизацию
    const authToken = localStorage.getItem('auth_token')
    if (!authToken) {
      navigate('/')
      return
    }
    setLoading(false)
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_info')
    navigate('/')
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <h2>{t('loading')}</h2>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', width: '100vw', boxSizing: 'border-box', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button 
            onClick={handleLogout}
            style={{
              padding: '10px 20px',
              background: '#1DB954',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            {t('logout')}
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', marginBottom: '20px', borderBottom: '2px solid #e1e5e9', background: 'white', borderRadius: '10px 10px 0 0', overflow: 'hidden' }}>
        <button
          onClick={() => setActiveTab('chat')}
          style={{
            flex: 1,
            padding: '15px 20px',
            background: activeTab === 'chat' ? '#667eea' : '#f8f9fa',
            color: activeTab === 'chat' ? 'white' : '#333',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: activeTab === 'chat' ? '600' : '400',
            transition: 'all 0.2s ease'
          }}
        >
          🤖 {t('ai_chat')}
        </button>
        <button
          onClick={() => setActiveTab('recommendations')}
          style={{
            flex: 1,
            padding: '15px 20px',
            background: activeTab === 'recommendations' ? '#667eea' : '#f8f9fa',
            color: activeTab === 'recommendations' ? 'white' : '#333',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: activeTab === 'recommendations' ? '600' : '400',
            transition: 'all 0.2s ease'
          }}
        >
          🎵 {t('music_recommend')}
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          style={{
            flex: 1,
            padding: '15px 20px',
            background: activeTab === 'favorites' ? '#667eea' : '#f8f9fa',
            color: activeTab === 'favorites' ? 'white' : '#333',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: activeTab === 'favorites' ? '600' : '400',
            transition: 'all 0.2s ease'
          }}
        >
          ❤️ {t('favorites')}
        </button>
      </div>
      {activeTab === 'chat' && <Chat />}
      {activeTab === 'recommendations' && <Recommendations />}
      {activeTab === 'favorites' && <Favorites />}
    </div>
  )
}

export default Dashboard 