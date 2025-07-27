import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

function startApp() {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

if (document.readyState === 'complete') {
  startApp();
} else {
  window.addEventListener('load', startApp);
}
