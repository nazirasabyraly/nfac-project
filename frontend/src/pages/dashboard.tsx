import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config'
import Chat from '../components/Chat'

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
        <h2>Загрузка...</h2>
        <p>Анализируем ваш музыкальный вкус ⏳</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', width: '100vw', boxSizing: 'border-box', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>🎵 Aivi Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center' }}>
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
            Выйти
          </button>
          <button
            className="theme-toggle-btn"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
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
          📊 Анализ музыки
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
          🤖 ИИ-чат
        </button>
      </div>

      {/* Контент табов */}
      {activeTab === 'analysis' && (
        <div>
          {/* Профиль пользователя */}
          {userProfile && (
            <div className="dashboard-block fade-in slide-up" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
              <h2>👤 Профиль</h2>
              <p><strong>Имя:</strong> {userProfile.display_name}</p>
              <p><strong>Email:</strong> {userProfile.email}</p>
              <p><strong>Страна:</strong> {userProfile.country}</p>
            </div>
          )}

          {/* Сообщение о недостатке данных */}
          {!hasData && !loading && (
            <div className="dashboard-block fade-in slide-up" style={{ background: '#fff3cd', border: '1px solid #ffeaa7', padding: '20px', borderRadius: '10px', marginBottom: '20px', color: '#222', width: '100%' }}>
              <h2>🎵 Добро пожаловать в Aivi!</h2>
              <p>Похоже, что в вашем Spotify аккаунте пока мало данных для анализа. Вот что можно сделать:</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginTop: '20px' }}>
                <div style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e9ecef', color: '#222' }}>
                  <h4>🎼 Слушайте больше музыки</h4>
                  <p>Чем больше треков вы слушаете в Spotify, тем точнее будет анализ вашего вкуса.</p>
                </div>
                <div style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e9ecef', color: '#222' }}>
                  <h4>❤️ Лайкайте треки</h4>
                  <p>Ставьте лайки любимым песням, чтобы мы лучше понимали ваши предпочтения.</p>
                </div>
                <div style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e9ecef', color: '#222' }}>
                  <h4>📱 Создавайте плейлисты</h4>
                  <p>Создавайте плейлисты под разные настроения и активности.</p>
                </div>
              </div>
            </div>
          )}

          {/* Анализ музыкальных предпочтений */}
          {musicAnalysis && hasData && (
            <div className="dashboard-block fade-in slide-up" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
              <h2>🎼 Анализ музыкального вкуса</h2>
              
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                <span style={{ fontSize: '24px', marginRight: '10px' }}>
                  {getMoodEmoji(musicAnalysis.overall_mood)}
                </span>
                <h3>Общее настроение: {musicAnalysis.overall_mood}</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                <div style={{ background: 'white', padding: '15px', borderRadius: '8px' }}>
                  <h4>😊 Позитивность</h4>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1DB954' }}>
                    {formatPercentage(musicAnalysis.mood.valence)}%
                  </p>
                </div>
                <div style={{ background: 'white', padding: '15px', borderRadius: '8px' }}>
                  <h4>⚡ Энергичность</h4>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1DB954' }}>
                    {formatPercentage(musicAnalysis.mood.energy)}%
                  </p>
                </div>
                <div style={{ background: 'white', padding: '15px', borderRadius: '8px' }}>
                  <h4>💃 Танцевальность</h4>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1DB954' }}>
                    {formatPercentage(musicAnalysis.mood.danceability)}%
                  </p>
                </div>
                <div style={{ background: 'white', padding: '15px', borderRadius: '8px' }}>
                  <h4>🎵 Темп</h4>
                  <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1DB954' }}>
                    {Math.round(musicAnalysis.mood.tempo)} BPM
                  </p>
                </div>
              </div>

              <div style={{ background: 'white', padding: '15px', borderRadius: '8px' }}>
                <h4>🎤 Любимые исполнители</h4>
                <p>{musicAnalysis.preferences.favorite_artists.slice(0, 5).join(', ')}</p>
                <p style={{ fontSize: '12px', color: '#666' }}>
                  Проанализировано треков: {musicAnalysis.preferences.total_tracks_analyzed}
                </p>
              </div>
            </div>
          )}

          {/* Топ треки */}
          {topTracks.length > 0 && hasData && (
            <div className="dashboard-block fade-in slide-up" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
              <h2>🔥 Ваши топ треки</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                {topTracks.map((track, index) => (
                  <div key={index} style={{ background: 'white', padding: '15px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
                    {track.image && (
                      <img 
                        src={track.image} 
                        alt={track.name}
                        style={{ width: '60px', height: '60px', borderRadius: '5px', marginRight: '15px' }}
                      />
                    )}
                    <div>
                      <h4 style={{ margin: '0 0 5px 0' }}>{track.name}</h4>
                      <p style={{ margin: '0', color: '#666' }}>{track.artist}</p>
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                        <span>😊 {formatPercentage(track.valence)}%</span> • 
                        <span>⚡ {formatPercentage(track.energy)}%</span> • 
                        <span>💃 {formatPercentage(track.danceability)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ошибка */}
          {error && (
            <div className="dashboard-block fade-in slide-up" style={{ background: '#f8d7da', border: '1px solid #f5c6cb', padding: '20px', borderRadius: '10px', marginBottom: '20px', color: '#b30000', width: '100%' }}>
              <h3>❌ Ошибка</h3>
              <p>{error}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'chat' && (
        <div style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}>
          <Chat userPreferences={musicAnalysis} />
        </div>
      )}
    </div>
  )
}

export default Dashboard 