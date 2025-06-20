const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'build')));

// Health check endpoint for DigitalOcean
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    service: 'ripcity-frontend',
    timestamp: new Date().toISOString()
  });
});

// Catch all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, () => {
  console.log(`🏀 Rip City Frontend server running on port ${port}`);
});