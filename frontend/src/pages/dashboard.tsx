import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config'
import Chat from '../components/Chat'
import { useTranslation } from 'react-i18next'

interface MusicAnalysis {
  mood: {
    valence: number;
    energy: number;
    danceability: number;
    tempo: number;
  };
  preferences: {
    favorite_artists: string[];
    total_tracks_analyzed: number;
  };
  overall_mood: string;
}

interface Track {
  name: string;
  artist: string;
  image: string;
  valence: number;
  energy: number;
  danceability: number;
}

const Dashboard = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [musicAnalysis, setMusicAnalysis] = useState<MusicAnalysis | null>(null)
  const [topTracks, setTopTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [hasData, setHasData] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'analysis' | 'chat'>('analysis')
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')

  useEffect(() => {
    document.documentElement.classList.remove('theme-light', 'theme-dark')
    document.documentElement.classList.add(theme === 'dark' ? 'theme-dark' : 'theme-light')
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    // Check for token in URL parameters (from Spotify OAuth redirect)
    const urlParams = new URLSearchParams(window.location.search)
    const tokenFromUrl = urlParams.get('token')
    const spotifyIdFromUrl = urlParams.get('spotify_id')
    
    if (tokenFromUrl) {
      console.log('🎯 Token found in URL, saving to localStorage')
      localStorage.setItem('spotify_token', tokenFromUrl)
      if (spotifyIdFromUrl) {
        localStorage.setItem('spotify_id', spotifyIdFromUrl)
      }
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }

    const authToken = localStorage.getItem('auth_token')
    const spotifyToken = localStorage.getItem('spotify_token')
    
    if (!authToken && !spotifyToken) {
      navigate('/')
      return
    }

    const fetchData = async () => {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        }

        // Используем auth_token для API запросов, если есть
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`
        } else if (spotifyToken) {
          headers['Authorization'] = `Bearer ${spotifyToken}`
        }

        // Получаем профиль пользователя
        const profileResponse = await fetch(`${API_BASE_URL}/media/profile`, { headers })
        if (profileResponse.ok) {
          const profile = await profileResponse.json()
          setUserProfile(profile)
        }

        // Получаем анализ музыкальных предпочтений
        const analysisResponse = await fetch(`${API_BASE_URL}/media/analysis`, { headers })
        if (analysisResponse.ok) {
          const analysis = await analysisResponse.json()
          if (analysis.error) {
            setError(analysis.error)
          } else {
            setMusicAnalysis(analysis)
            setHasData(true)
          }
        }

        // Получаем топ треки
        const tracksResponse = await fetch(`${API_BASE_URL}/media/top-tracks?limit=5`, { headers })
        if (tracksResponse.ok) {
          const tracksData = await tracksResponse.json()
          if (tracksData.tracks && tracksData.tracks.length > 0) {
            setTopTracks(tracksData.tracks)
            setHasData(true)
          }
        }

      } catch (error) {
        console.error('Error fetching data:', error)
        setError('Ошибка при загрузке данных')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('spotify_token')
    localStorage.removeItem('user_info')
    navigate('/')
  }

  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case 'Позитивное': return '😊'
      case 'Нейтральное': return '😐'
      case 'Меланхоличное': return '😔'
      default: return '🎵'
    }
  }

  const formatPercentage = (value: number) => {
    return Math.round(value * 100)
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <h2>{t('loading')}</h2>
        <p>{t('analyzing_music')}</p>
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
          <button
            className="theme-toggle-btn"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? t('light_theme') : t('dark_theme')}
          >
            {theme === 'dark' ? '🌞' : '🌙'}
          </button>
        </div>
      </div>

      {/* Табы для переключения */}
      <div style={{ 
        display: 'flex', 
        marginBottom: '20px', 
        borderBottom: '2px solid #e1e5e9',
        background: 'white',
        borderRadius: '10px 10px 0 0',
        overflow: 'hidden'
      }}>
        <button
          onClick={() => setActiveTab('analysis')}
          style={{
            flex: 1,
            padding: '15px 20px',
            background: activeTab === 'analysis' ? '#667eea' : '#f8f9fa',
            color: activeTab === 'analysis' ? 'white' : '#333',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: activeTab === 'analysis' ? '600' : '400',
            transition: 'all 0.2s ease'
          }}
        >
          📊 {t('music_analysis')}
        </button>
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
      </div>

      {/* Контент табов */}
      {activeTab === 'analysis' && (
        <div>
          {/* Профиль пользователя */}
          {userProfile && (
            <div className="dashboard-block fade-in slide-up" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
              <h2>👤 {t('profile')}</h2>
              <p><strong>{t('name')}:</strong> {userProfile.display_name}</p>
              <p><strong>Email:</strong> {userProfile.email}</p>
              <p><strong>{t('country')}:</strong> {userProfile.country}</p>
            </div>
          )}

          {/* Сообщение о недостатке данных */}
          {!hasData && !loading && (
            <div className="dashboard-block fade-in slide-up" style={{ background: '#fff3cd', border: '1px solid #ffeaa7', padding: '20px', borderRadius: '10px', marginBottom: '20px', color: '#222', width: '100%' }}>
              <h2>🎵 {t('welcome')}</h2>
              <p>{t('not_enough_data')}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginTop: '20px' }}>
                <div style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e9ecef', color: '#222' }}>
                  <h4>🎼 {t('listen_more_music')}</h4>
                  <p>{t('listen_more_music_desc')}</p>
                </div>
                <div style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e9ecef', color: '#222' }}>
                  <h4>❤️ {t('like_tracks')}</h4>
                  <p>{t('like_tracks_desc')}</p>
                </div>
                <div style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e9ecef', color: '#222' }}>
                  <h4>📱 {t('create_playlists')}</h4>
                  <p>{t('create_playlists_desc')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Анализ музыкальных предпочтений */}
          {musicAnalysis && hasData && (
            <div className="dashboard-block fade-in slide-up" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
              <h2>🎼 {t('music_analysis')}</h2>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                <span style={{ fontSize: '24px', marginRight: '10px' }}>
                  {getMoodEmoji(musicAnalysis.overall_mood)}
                </span>
                <h3>{t('overall_mood')}: {musicAnalysis.overall_mood}</h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                <div style={{ background: 'white', padding: '15px', borderRadius: '8px' }}>
                  <h4>😊 {t('positivity')}</h4>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1DB954' }}>
                    {formatPercentage(musicAnalysis.mood.valence)}%
                  </p>
                </div>
                <div style={{ background: 'white', padding: '15px', borderRadius: '8px' }}>
                  <h4>⚡️ {t('energy')}</h4>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1DB954' }}>
                    {formatPercentage(musicAnalysis.mood.energy)}%
                  </p>
                </div>
                <div style={{ background: 'white', padding: '15px', borderRadius: '8px' }}>
                  <h4>💃 {t('danceability')}</h4>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1DB954' }}>
                    {formatPercentage(musicAnalysis.mood.danceability)}%
                  </p>
                </div>
                <div style={{ background: 'white', padding: '15px', borderRadius: '8px' }}>
                  <h4>🎵 {t('tempo')}</h4>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1DB954' }}>
                    {musicAnalysis.mood.tempo}
                  </p>
                </div>
              </div>
              <div style={{ marginBottom: '15px' }}>
                <h4>🎤 {t('favorite_artists')}</h4>
                <ul>
                  {musicAnalysis.preferences.favorite_artists.map((artist, idx) => (
                    <li key={idx}>{artist}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4>🎧 {t('total_tracks_analyzed')}: {musicAnalysis.preferences.total_tracks_analyzed}</h4>
              </div>
            </div>
          )}

          {/* Топ треки */}
          {topTracks.length > 0 && (
            <div className="dashboard-block fade-in slide-up" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
              <h2>🎵 {t('top_tracks')}</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                {topTracks.map((track, idx) => (
                  <div key={idx} style={{ background: 'white', borderRadius: '8px', padding: '10px', minWidth: '180px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <img src={track.image} alt={track.name} style={{ width: '100%', borderRadius: '6px', marginBottom: '8px' }} />
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{track.name}</div>
                    <div style={{ color: '#888', marginBottom: '4px' }}>{track.artist}</div>
                    <div style={{ fontSize: '12px', color: '#555' }}>{t('positivity')}: {formatPercentage(track.valence)}%</div>
                    <div style={{ fontSize: '12px', color: '#555' }}>{t('energy')}: {formatPercentage(track.energy)}%</div>
                    <div style={{ fontSize: '12px', color: '#555' }}>{t('danceability')}: {formatPercentage(track.danceability)}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Чат */}
      {activeTab === 'chat' && (
        <Chat />
      )}
    </div>
  )
}

export default Dashboard 