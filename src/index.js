import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Render the root component. This uses the modern root API available in
// React 18+. If you are using an older version you can adapt by
// replacing with ReactDOM.render.
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
