import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config';
import { useTranslation } from 'react-i18next';

interface SavedSong {
  id: number;
  youtube_video_id: string;
  title: string;
  artist?: string;
  date_saved: string;
}

const Favorites: React.FC = () => {
  const { t } = useTranslation();
  const [songs, setSongs] = useState<SavedSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchSongs = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError(t('favorites_error'));
      setLoading(false);
      return;
    }
    try {
      const resp = await fetch(`${API_BASE_URL}/media/saved-songs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok) {
        const data = await resp.json();
        setSongs(data);
      } else {
        setError(t('favorites_error'));
      }
    } catch {
      setError(t('favorites_error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSongs();
    // eslint-disable-next-line
  }, []);

  const handleDelete = async (youtube_video_id: string) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    try {
      const resp = await fetch(`${API_BASE_URL}/media/saved-songs/${youtube_video_id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok) {
        setSongs(songs => songs.filter(s => s.youtube_video_id !== youtube_video_id));
        setSuccess(t('favorites_deleted'));
      } else {
        setError(t('favorites_error'));
      }
    } catch {
      setError(t('favorites_error'));
    }
  };

  if (loading) return <div>{t('favorites_loading')}</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!songs.length) return <div>{t('favorites_empty')}</div>;

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {success && <div style={{ color: 'green', marginBottom: 12 }}>{success}</div>}
      {songs.map(song => (
        <div key={song.id} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: 16, display: 'flex', gap: 20 }}>
          <div>
            <iframe
              width="220"
              height="124"
              src={`https://www.youtube.com/embed/${song.youtube_video_id}`}
              title={song.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ borderRadius: 8 }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 17, marginBottom: 4 }}>{song.title}</div>
            <div style={{ color: '#667eea', fontSize: 15, marginBottom: 8 }}>{song.artist}</div>
            <div style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>{t('favorites_date_added')}: {new Date(song.date_saved).toLocaleString()}</div>
            <button
              onClick={() => handleDelete(song.youtube_video_id)}
              style={{ background: '#e1e5e9', color: '#ff4d6d', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', transition: 'all 0.2s' }}
            >
              {t('favorites_delete')}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Favorites; 