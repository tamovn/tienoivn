import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './index.tsx'; // nếu đang dùng index.tsx làm App
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
