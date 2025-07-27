import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Prevent FOUC by showing content after React loads
document.addEventListener('DOMContentLoaded', function() {
  document.documentElement.classList.add('wf-active');
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
