import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

function renderApp() {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

const cssLink = document.querySelector('link[href^="/static/css/"]');
if (cssLink && !cssLink.sheet) {
  cssLink.addEventListener('load', renderApp, { once: true });
} else {
  renderApp();
}
