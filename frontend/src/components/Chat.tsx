import React, { useState, useRef, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import './Chat.css';
import { useTranslation } from 'react-i18next';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  mediaUrl?: string;
  moodAnalysis?: any;
  recommendations?: any;
}

interface ChatProps {
  userPreferences?: any;
}

const AI_LANGUAGES = [
  { code: 'ru', label: 'Русский', prompt: 'Пожалуйста, отвечай мне только на русском языке.' },
  { code: 'en', label: 'English', prompt: 'Please reply to the user only in English.' },
  { code: 'kz', label: 'Қазақша', prompt: 'Пайдаланушыға тек қазақ тілінде жауап бер.' },
];

const Chat: React.FC<ChatProps> = ({ userPreferences }) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [currentMoodAnalysis, setCurrentMoodAnalysis] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [player, setPlayer] = useState<any>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [mediaDescription, setMediaDescription] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showDescriptionInput, setShowDescriptionInput] = useState(false);
  const [aiLang, setAiLang] = useState(() => localStorage.getItem('ai_lang') || 'ru');
  const aiLangObj = AI_LANGUAGES.find(l => l.code === aiLang) || AI_LANGUAGES[0];
  const [youtubeCache, setYoutubeCache] = useState<{ [key: string]: { videoId: string, url: string } }>({});
  const getYoutubeEmbedUrl = (videoId: string, startMs?: number) => {
    if (!videoId) return '';
    const startSec = startMs ? Math.floor(startMs / 1000) : 0;
    return `https://www.youtube.com/embed/${videoId}${startSec ? `?start=${startSec}` : ''}`;
  };
  const embedRefs = useRef<{ [key: string]: HTMLIFrameElement | null }>({});

  const apiBaseUrl = API_BASE_URL;

  // Автоскролл к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Загружаем историю чата с backend при загрузке
  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      try {
        const resp = await fetch(`${API_BASE_URL}/chat/history`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data.length === 0) {
            // Если история пуста — приветствие
            setMessages([{
              id: '1',
              type: 'ai' as const,
              content:
                aiLang === 'en'
                  ? "Hello! I'm your music assistant. Send me a photo or video, and I'll analyze the mood and suggest suitable music! 🎵"
                  : aiLang === 'kz'
                  ? "Сәлем! Мен сенің музыкалық көмекшіңмін. Маған фото немесе видео жібер, мен көңіл-күйді талдап, лайықты музыка ұсынамын! 🎵"
                  : "Привет! Я твой музыкальный помощник. Отправь мне фото или видео, и я проанализирую настроение и подберу подходящую музыку! 🎵",
              timestamp: new Date()
            }]);
          } else {
            setMessages(data.map((msg: any) => ({
              id: String(msg.id),
              type: msg.role === 'ai' ? 'ai' : 'user',
              content: msg.content,
              timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
              mediaUrl: msg.media_url || undefined
            })));
          }
        }
      } catch {}
    };
    fetchHistory();
    // eslint-disable-next-line
  }, [aiLang]);

  // Сохраняем новое сообщение в backend
  const saveMessageToBackend = async (msg: Message) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    try {
      await fetch(`${API_BASE_URL}/chat/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          role: msg.type,
          content: msg.content,
          media_url: msg.mediaUrl || null,
          timestamp: msg.timestamp
        })
      });
    } catch {}
  };

  // Инициализация Spotify Web Playback SDK
  useEffect(() => {
    // Определяем функцию до загрузки скрипта
    (window as any).onSpotifyWebPlaybackSDKReady = () => {
      const token = localStorage.getItem('spotify_token');
      if (!token || player) return;
      // @ts-ignore
      const _player = new window.Spotify.Player({
        name: 'VibeMatch Player',
        getOAuthToken: cb => { cb(token); },
        volume: 0.5
      });
      _player.addListener('ready', ({ device_id }: any) => {
        setDeviceId(device_id);
        console.log('Spotify Player готов, device_id:', device_id);
      });
      _player.addListener('not_ready', ({ device_id }: any) => {
        console.log('Устройство не готово:', device_id);
      });
      _player.connect();
      setPlayer(_player);
    };
    // Динамически подключаем скрипт, если ещё не подключён
    if (!document.getElementById('spotify-sdk')) {
      const script = document.createElement('script');
      script.id = 'spotify-sdk';
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      document.body.appendChild(script);
    } else if ((window as any).Spotify) {
      // Если SDK уже загружен
      (window as any).onSpotifyWebPlaybackSDKReady();
    }
    // eslint-disable-next-line
  }, [player]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    saveMessageToBackend(userMessage);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/chat/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          mood_analysis: currentMoodAnalysis,
          system_prompt: aiLangObj.prompt
        })
      });

      const data = await response.json();

      if (data.success) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: data.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
        saveMessageToBackend(aiMessage);
      }
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'Извините, произошла ошибка. Попробуйте еще раз.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      saveMessageToBackend(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setShowDescriptionInput(true);
  };

  const handleSendFileWithDescription = async () => {
    if (!pendingFile) return;
    setUploadingFile(true);
    setShowDescriptionInput(false);
    try {
      const mediaUrl = URL.createObjectURL(pendingFile);
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: mediaDescription || '',
        timestamp: new Date(),
        mediaUrl
      };
      setMessages(prev => [...prev, userMessage]);
      saveMessageToBackend(userMessage);
      // Анализируем медиафайл
      const formData = new FormData();
      formData.append('file', pendingFile);
      if (mediaDescription) formData.append('description', mediaDescription);
      console.log('🚀 Отправляем запрос на анализ...');
      const analysisResponse = await fetch(`${apiBaseUrl}/chat/analyze-media`, {
        method: 'POST',
        body: formData
      });
      console.log('📡 Получен ответ:', analysisResponse.status, analysisResponse.statusText);
      const analysisData = await analysisResponse.json();
      console.log('📊 Данные анализа:', analysisData);
      if (analysisData.success) {
        setCurrentMoodAnalysis(analysisData);
        // Формируем красивый текст анализа
        let mood = analysisData.mood || (analysisData.description && analysisData.description.mood) || '-';
        let emotions = analysisData.emotions || (analysisData.description && analysisData.description.emotions) || [];
        let genre = analysisData.music_genre || (analysisData.description && analysisData.description.music_genre) || '-';
        let colors = analysisData.colors || (analysisData.description && analysisData.description.colors) || '-';
        let description = analysisData.description;
        let caption = analysisData.caption || (typeof description === 'object' && description.caption) || '';
        // Если description — это объект, берем из него текстовое описание
        let descriptionText = typeof description === 'object' && description.description ? description.description : (typeof description === 'string' ? description : '');
        const analysisMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content:
            `<div><strong>🎨 Анализ настроения:</strong></div>` +
            `<div><b>Настроение:</b> ${mood}</div>` +
            `<div><b>Эмоции:</b> ${Array.isArray(emotions) ? emotions.join(', ') : emotions || '-'}</div>` +
            `<div><b>Жанр музыки:</b> ${genre}</div>` +
            `<div><b>Цвета:</b> ${colors}</div>` +
            (descriptionText ? `<div><b>Описание:</b> ${descriptionText}</div>` : '') +
            (caption ? `<div style='margin-top:8px;'><b>💡 Предлагаю описание для вашего поста:</b><br><i>«${caption}»</i></div>` : '') +
            `<div style='margin-top:8px;'>Теперь я подберу для тебя музыку!</div>`,
          timestamp: new Date(),
          moodAnalysis: analysisData
        };
        setMessages(prev => [...prev, analysisMessage]);
        saveMessageToBackend(analysisMessage);
        // Получаем рекомендации
        const recommendationsResponse = await fetch(`${apiBaseUrl}/chat/get-recommendations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('auth_token') ? { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` } : {})
          },
          body: JSON.stringify({
            mood_analysis: analysisData,
            user_preferences: userPreferences
          })
        });
        const recommendationsData = await recommendationsResponse.json();
        const recommendationsMessage: Message = {
          id: (Date.now() + 2).toString(),
          type: 'ai',
          content: `🎵 Музыкальные рекомендации:`,
          timestamp: new Date(),
          recommendations: {
            personal: recommendationsData.personal,
            global: recommendationsData.global
          }
        };
        setMessages(prev => [...prev, recommendationsMessage]);
        saveMessageToBackend(recommendationsMessage);
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: `Ошибка анализа файла: ${analysisData.error || 'Неизвестная ошибка'}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
        saveMessageToBackend(errorMessage);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'Извините, произошла ошибка при анализе файла. Попробуйте еще раз.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      saveMessageToBackend(errorMessage);
    } finally {
      setUploadingFile(false);
      setPendingFile(null);
      setMediaDescription('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessage = (content: string) => {
    // Простое форматирование markdown
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  };

  const formatTime = (ms?: number) => {
    if (!ms) return '0:00';
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  // Функция поиска YouTube-видео по названию и артисту
  const fetchYoutubeVideo = async (trackName: string, artist: string) => {
    const key = `${trackName}__${artist}`;
    if (youtubeCache[key]) return youtubeCache[key];
    try {
      const resp = await fetch(`${API_BASE_URL}/recommend/youtube-search?q=${encodeURIComponent(trackName + ' ' + artist)}&max_results=1`);
      const data = await resp.json();
      console.log('YouTube API response for', trackName, artist, data); // debug
      if (data.results && data.results.length > 0) {
        const videoId = data.results[0].video_id;
        const url = `https://www.youtube.com/watch?v=${videoId}`;
        setYoutubeCache(prev => ({ ...prev, [key]: { videoId, url } }));
        return { videoId, url };
      }
    } catch {}
    setYoutubeCache(prev => ({ ...prev, [key]: { videoId: '', url: '' } }));
    return { videoId: '', url: '' };
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontWeight: 600, fontSize: 18 }}>{t('ai_helper_title')}</div>
          <div style={{ color: '#fff', fontSize: 14, marginTop: 2 }}>
            🎬 {t('ai_helper_subtitle')}
          </div>
        </div>
      </div>

      <div className="chat-messages">
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span role="img" aria-label="lang">🌐</span>
          <span style={{ fontWeight: 500 }}>{t('ai_lang_label')}</span>
          <select
            value={aiLang}
            onChange={e => {
              setAiLang(e.target.value);
              localStorage.setItem('ai_lang', e.target.value);
            }}
            style={{ padding: '4px 8px', borderRadius: 4 }}
          >
            {AI_LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.type}`}>
            <div className="message-content">
              {message.mediaUrl && (
                <div className="media-preview" style={{ marginBottom: 8 }}>
                  {message.mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <img
                      src={message.mediaUrl}
                      alt="Uploaded media"
                      style={{ maxWidth: 220, maxHeight: 160, borderRadius: 8, margin: 4 }}
                    />
                  ) : message.mediaUrl.match(/\.(mp4|mov|avi|mkv|webm)$/i) ? (
                    <video
                      controls
                      style={{ maxWidth: 220, borderRadius: 8, margin: 4 }}
                    >
                      <source src={message.mediaUrl} />
                      Ваш браузер не поддерживает видео.
                    </video>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#888', fontSize: 15 }}>
                      <span role="img" aria-label="file">📎</span>
                      <span>{message.mediaUrl.split('/').pop()}</span>
                    </div>
                  )}
                  {/* Показываем описание, если оно есть */}
                  {message.content && (
                    <div style={{ marginTop: 6, color: '#444', fontSize: 14 }}>{message.content}</div>
                  )}
                </div>
              )}
              <div 
                className="message-text"
                dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
              />
              {/* Если есть рекомендации, показываем две подборки */}
              {message.recommendations && (message.recommendations.personal || message.recommendations.global) && (
                (() => {
                  const personal = message.recommendations.personal?.recommended_tracks || [];
                  const global = message.recommendations.global?.recommended_tracks || [];
                  if (personal.length === 0 && global.length === 0) {
                    return <div style={{ marginTop: 16, color: '#888', fontSize: 15 }}>Нет рекомендаций</div>;
                  }
                  return (
                    <div style={{ marginTop: 16, width: '100%' }}>
                      {['personal', 'global'].map(type => (
                        message.recommendations[type] && message.recommendations[type].recommended_tracks && message.recommendations[type].recommended_tracks.length > 0 && (
                          <div key={type} style={{ marginBottom: 28 }}>
                            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 8, color: type === 'personal' ? '#1DB954' : '#667eea' }}>
                              {type === 'personal' ? 'Персональные рекомендации' : 'Глобальные рекомендации'}
                            </div>
                            <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
                              <table style={{ width: 'max-content', background: '#fff', borderRadius: 8, overflow: 'hidden', fontSize: 14 }}>
                                <thead>
                                  <tr style={{ background: '#f5f5f5' }}>
                                    <th style={{ padding: 8 }}>Название</th>
                                    <th style={{ padding: 8 }}>Артист</th>
                                    <th style={{ padding: 8 }}>Причина</th>
                                    <th style={{ padding: 8 }}>YouTube</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {message.recommendations[type].recommended_tracks.map((track: any, idx: number) => {
                                    const key = `${type}__${track.name}__${track.artist}`;
                                    const cached = youtubeCache[key];
                                    if (!cached) fetchYoutubeVideo(track.name, track.artist);
                                    return (
                                      <tr key={key}>
                                        <td style={{ padding: 8 }}>{track.name}</td>
                                        <td style={{ padding: 8 }}>{track.artist}</td>
                                        <td style={{ padding: 8 }}>{track.reason}</td>
                                        <td style={{ padding: 8, minWidth: 240, maxWidth: 260 }}>
                                          {cached === undefined ? (
                                            <span style={{ color: '#888', fontSize: 13 }}>Поиск видео...</span>
                                          ) : cached.videoId ? (
                                            <iframe
                                              ref={el => { embedRefs.current[key] = el; }}
                                              width="220"
                                              height="124"
                                              src={getYoutubeEmbedUrl(cached.videoId, track.start_time_ms)}
                                              title={track.name}
                                              frameBorder="0"
                                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                              allowFullScreen
                                              style={{ borderRadius: 8, marginTop: 4, display: 'block' }}
                                            />
                                          ) : (
                                            <span style={{ color: '#888', fontSize: 13 }}>Видео не найдено</span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  );
                })()
              )}
              <div className="message-time">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="message ai">
            <div className="message-content">
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <div className="file-upload-section">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <button
            className="upload-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingFile}
          >
            {uploadingFile ? '📤 Загрузка...' : '📎 Прикрепить файл'}
          </button>
        </div>

        {/* Окно для ввода описания к медиафайлу */}
        {showDescriptionInput && (
          <div style={{ marginBottom: 12, background: '#f8f9fa', padding: 12, borderRadius: 8 }}>
            <div style={{ marginBottom: 8 }}>Добавьте описание к вашему медиафайлу (необязательно):</div>
            <input
              type="text"
              value={mediaDescription}
              onChange={e => setMediaDescription(e.target.value)}
              placeholder="Например: 'Моё настроение сегодня'"
              style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc', marginBottom: 8 }}
              disabled={uploadingFile}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleSendFileWithDescription}
                disabled={uploadingFile}
                style={{ background: '#1DB954', color: 'white', border: 'none', borderRadius: 4, padding: '6px 16px', cursor: 'pointer' }}
              >
                Отправить
              </button>
              <button
                onClick={() => { setShowDescriptionInput(false); setPendingFile(null); setMediaDescription(''); }}
                disabled={uploadingFile}
                style={{ background: '#eee', color: '#333', border: 'none', borderRadius: 4, padding: '6px 16px', cursor: 'pointer' }}
              >
                Отмена
              </button>
            </div>
          </div>
        )}

        <div className="input-section">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Напиши сообщение или отправь медиафайл..."
            disabled={isLoading}
            rows={1}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="send-btn"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat; 