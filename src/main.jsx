import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AppProvider } from './context/AppContext.jsx';
import { ensureSeeded } from './utils/storage.js';
import './styles/base.css';
import './styles/components.css';
import './styles/pages.css';
import './styles/dashboard.css';

// Load demo data into localStorage on first visit
ensureSeeded();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>
);
