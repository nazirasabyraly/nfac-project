import React, { useState, useRef } from 'react';
import { API_BASE_URL } from '../config';
import { useTranslation } from 'react-i18next';
import AudioWithCache from './AudioWithCache';

interface YouTubeVideo {
  video_id: string;
  title: string;
  channel: string;
  thumbnail: string;
}

const Recommendations: React.FC = () => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [liked, setLiked] = useState<{ [videoId: string]: boolean }>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const resp = await fetch(`${API_BASE_URL}/recommend/youtube-search?q=${encodeURIComponent(query)}`);
      const data = await resp.json();
      if (data.results) {
        setResults(data.results);
      } else {
        setResults([]);
        setError(data.error || t('recommendations_error'));
      }
    } catch (err) {
      setError(t('recommendations_error'));
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (video: YouTubeVideo) => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError(t('recommendations_login_required'));
      return;
    }
    try {
      const resp = await fetch(`${API_BASE_URL}/media/saved-songs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          youtube_video_id: video.video_id,
          title: video.title,
          artist: video.channel
        })
      });
      if (resp.ok) {
        setLiked(prev => ({ ...prev, [video.video_id]: true }));
        setSuccess(t('recommendations_success_like'));
      } else {
        setError(t('recommendations_error'));
      }
    } catch {
      setError(t('recommendations_error'));
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t('recommendations_search_placeholder')}
          style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #ccc', fontSize: 16 }}
        />
        <button type="submit" style={{ padding: '10px 20px', borderRadius: 8, background: '#667eea', color: 'white', border: 'none', fontWeight: 600 }}>
          {loading ? t('recommendations_searching') : t('recommendations_search_button')}
        </button>
      </form>
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
      {success && <div style={{ color: 'green', marginBottom: 12 }}>{success}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {results.map(video => (
          <div key={video.video_id} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: 16, display: 'flex', gap: 20 }}>
            <div>
              {typeof window !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent) ? null : (
                <iframe
                  width="220"
                  height="124"
                  src={`https://www.youtube.com/embed/${video.video_id}`}
                  title={video.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ borderRadius: 8 }}
                />
              )}
              <AudioWithCache
                src={`${API_BASE_URL}/recommend/youtube-audio?video_id=${video.video_id}`}
                style={{ marginTop: 8, width: 220 }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 17, marginBottom: 4 }}>{video.title}</div>
              <div style={{ color: '#667eea', fontSize: 15, marginBottom: 8 }}>{video.channel}</div>
              <button
                onClick={() => handleLike(video)}
                disabled={liked[video.video_id]}
                style={{
                  background: liked[video.video_id] ? '#e1e5e9' : '#ff4d6d',
                  color: liked[video.video_id] ? '#888' : 'white',
                  border: 'none',
                  borderRadius: 6,
                  padding: '8px 18px',
                  fontWeight: 600,
                  cursor: liked[video.video_id] ? 'not-allowed' : 'pointer',
                  fontSize: 15,
                  transition: 'all 0.2s',
                  boxShadow: liked[video.video_id] ? 'none' : '0 2px 8px rgba(255,77,109,0.08)'
                }}
              >
                {liked[video.video_id] ? t('recommendations_liked') : t('recommendations_like')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Recommendations; 