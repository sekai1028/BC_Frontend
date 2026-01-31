import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import backgroundImg from './public/asset/background.png'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div
      style={{
        backgroundImage: `url(${backgroundImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh',
      }}
    >
      <App />
    </div>
  </React.StrictMode>,
)
