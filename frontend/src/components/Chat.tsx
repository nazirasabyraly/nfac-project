import React, { useState, useRef, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import './Chat.css';

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

const Chat: React.FC<ChatProps> = ({ userPreferences }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [currentMoodAnalysis, setCurrentMoodAnalysis] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const apiBaseUrl = API_BASE_URL;

  // Автоскролл к последнему сообщению
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Приветственное сообщение
  useEffect(() => {
    setMessages([{
      id: '1',
      type: 'ai',
      content: 'Привет! Я твой музыкальный помощник. Отправь мне фото или видео, и я проанализирую настроение и подберу подходящую музыку! 🎵',
      timestamp: new Date()
    }]);
  }, []);

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
          mood_analysis: currentMoodAnalysis
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);

    try {
      // Создаем URL для предварительного просмотра
      const mediaUrl = URL.createObjectURL(file);

      // Добавляем сообщение пользователя с медиа
      const userMessage: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: `Отправлен файл: ${file.name}`,
        timestamp: new Date(),
        mediaUrl
      };

      setMessages(prev => [...prev, userMessage]);

      // Анализируем медиафайл
      const formData = new FormData();
      formData.append('file', file);

      const analysisResponse = await fetch(`${apiBaseUrl}/chat/analyze-media`, {
        method: 'POST',
        body: formData
      });

      const analysisData = await analysisResponse.json();

      if (analysisData.success) {
        setCurrentMoodAnalysis(analysisData);

        // Добавляем сообщение с анализом
        const analysisMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: `🎨 Анализ настроения:\n\n**Настроение:** ${analysisData.mood}\n**Описание:** ${analysisData.description}\n**Эмоции:** ${analysisData.emotions?.join(', ') || 'Не определены'}\n\nТеперь я подберу для тебя музыку!`,
          timestamp: new Date(),
          moodAnalysis: analysisData
        };

        setMessages(prev => [...prev, analysisMessage]);

        // Получаем рекомендации
        const recommendationsResponse = await fetch(`${apiBaseUrl}/chat/get-recommendations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mood_analysis: analysisData,
            user_preferences: userPreferences
          })
        });

        const recommendationsData = await recommendationsResponse.json();

        if (recommendationsData.success) {
          const recommendations = recommendationsData.recommendations;
          const tracksList = recommendations.recommended_tracks
            ?.map((track: any, index: number) => 
              `${index + 1}. **${track.name}** - ${track.artist}\n   ${track.reason}`
            )
            .join('\n\n') || 'Рекомендации будут добавлены позже';

          const recommendationsMessage: Message = {
            id: (Date.now() + 2).toString(),
            type: 'ai',
            content: `🎵 Музыкальные рекомендации:\n\n${tracksList}\n\n**Объяснение:** ${recommendations.explanation || 'Треки подобраны на основе анализа настроения'}`,
            timestamp: new Date(),
            recommendations: recommendations
          };

          setMessages(prev => [...prev, recommendationsMessage]);
        }
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: `Ошибка анализа файла: ${analysisData.error || 'Неизвестная ошибка'}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Ошибка загрузки файла:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'Извините, произошла ошибка при анализе файла. Попробуйте еще раз.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setUploadingFile(false);
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

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>🎵 Музыкальный ИИ-помощник</h3>
        <p>Отправь фото или видео для анализа настроения</p>
      </div>

      <div className="chat-messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.type}`}>
            <div className="message-content">
              {message.mediaUrl && (
                <div className="media-preview">
                  {message.mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <img src={message.mediaUrl} alt="Uploaded media" />
                  ) : (
                    <video controls>
                      <source src={message.mediaUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>
              )}
              <div 
                className="message-text"
                dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
              />
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