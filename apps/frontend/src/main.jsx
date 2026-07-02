import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { createRemoteAlbumRepository } from './infrastructure/remoteAlbumRepository.js';
import { App } from './ui/App.jsx';
import './styles.css';

const tokenStorage = {
  getItem: (key) => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
  removeItem: (key) => localStorage.removeItem(key)
};

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App createAlbumRepository={createRemoteAlbumRepository} tokenStorage={tokenStorage} />
  </BrowserRouter>
);
