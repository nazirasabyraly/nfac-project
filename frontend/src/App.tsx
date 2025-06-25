// src/App.tsx

import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/login'
import Callback from './pages/callback'
import Setup from './pages/setup'
import Dashboard from './pages/dashboard'
import LanguageSwitcher from './components/LanguageSwitcher'

const App = () => {
  return (
    <div>
      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 1000 }}>
        <LanguageSwitcher />
      </div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/callback" element={<Callback />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
