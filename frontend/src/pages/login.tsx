// src/pages/Login.tsx

import React from 'react'
import './login.css'
import { API_BASE_URL } from '../config'

const Login = () => {
  const handleLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/spotify/login`;
  };

  return (
    <div className="login-container">
      <h1>Instasong 🎧</h1>
      <p>Подбери идеальную музыку под твой вайб</p>
      <button onClick={handleLogin}>
        Войти через Spotify
      </button>
    </div>
  );
};

export default Login;
