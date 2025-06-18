import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../config'

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

  useEffect(() => {
    const token = localStorage.getItem('spotify_token')
    if (!token) {
      navigate('/')
      return
    }

    const fetchData = async () => {
      try {
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
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
    localStorage.removeItem('spotify_token')
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
      <div style={{ textAlign: 'center', marginTop: '20%' }}>
        <h2>Загрузка...</h2>
        <p>Анализируем ваш музыкальный вкус ⏳</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>🎵 VibeMatch Dashboard</h1>
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
      </div>

      {/* Профиль пользователя */}
      {userProfile && (
        <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
          <h2>👤 Профиль</h2>
          <p><strong>Имя:</strong> {userProfile.display_name}</p>
          <p><strong>Email:</strong> {userProfile.email}</p>
          <p><strong>Страна:</strong> {userProfile.country}</p>
        </div>
      )}

      {/* Сообщение о недостатке данных */}
      {!hasData && !loading && (
        <div style={{ background: '#fff3cd', border: '1px solid #ffeaa7', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
          <h2>🎵 Добро пожаловать в VibeMatch!</h2>
          <p>Похоже, что в вашем Spotify аккаунте пока мало данных для анализа. Вот что можно сделать:</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginTop: '20px' }}>
            <div style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
              <h4>🎼 Слушайте больше музыки</h4>
              <p>Чем больше треков вы слушаете в Spotify, тем точнее будет анализ вашего вкуса.</p>
            </div>
            
            <div style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
              <h4>❤️ Лайкайте треки</h4>
              <p>Ставьте лайки любимым песням, чтобы мы лучше понимали ваши предпочтения.</p>
            </div>
            
            <div style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
              <h4>📱 Создавайте плейлисты</h4>
              <p>Создавайте плейлисты под разные настроения и активности.</p>
            </div>
          </div>

          <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
            <h4>🚀 Попробуйте демо-режим</h4>
            <p>Хотите увидеть, как работает VibeMatch? Мы можем показать пример анализа на основе популярных треков.</p>
            <button 
              style={{
                padding: '10px 20px',
                background: '#1DB954',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                marginTop: '10px'
              }}
              onClick={() => {
                // Здесь можно добавить демо-данные
                setMusicAnalysis({
                  mood: {
                    valence: 0.7,
                    energy: 0.8,
                    danceability: 0.6,
                    tempo: 120
                  },
                  preferences: {
                    favorite_artists: ['The Weeknd', 'Dua Lipa', 'Post Malone', 'Ariana Grande', 'Drake'],
                    total_tracks_analyzed: 50
                  },
                  overall_mood: 'Позитивное'
                })
                setTopTracks([
                  {
                    name: 'Blinding Lights',
                    artist: 'The Weeknd',
                    image: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36',
                    valence: 0.7,
                    energy: 0.8,
                    danceability: 0.6
                  },
                  {
                    name: 'Levitating',
                    artist: 'Dua Lipa',
                    image: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36',
                    valence: 0.8,
                    energy: 0.7,
                    danceability: 0.8
                  }
                ])
                setHasData(true)
              }}
            >
              Запустить демо
            </button>
          </div>
        </div>
      )}

      {/* Анализ музыкальных предпочтений */}
      {musicAnalysis && hasData && (
        <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
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
        <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
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
        <div style={{ background: '#f8d7da', border: '1px solid #f5c6cb', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
          <h3>❌ Ошибка</h3>
          <p>{error}</p>
        </div>
      )}

      {/* Функции в разработке */}
      <div style={{ background: '#f5f5f5', padding: '20px', borderRadius: '10px' }}>
        <h3>🔧 Функции в разработке:</h3>
        <ul>
          <li>📸 Анализ настроения фото/видео</li>
          <li>🎵 Подбор музыки под контент</li>
          <li>📱 Интеграция с Instagram Stories</li>
          <li>🎼 Создание плейлистов под настроение</li>
          <li>🤝 Сравнение вкусов с друзьями</li>
        </ul>
      </div>
    </div>
  )
}

export default Dashboard 