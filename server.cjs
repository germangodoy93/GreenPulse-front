const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const API_TARGET = 'https://greenpulse-back-production.up.railway.app';

// Proxy /api → backend (server-to-server, no CORS)
app.use(
  '/api',
  createProxyMiddleware({
    target: API_TARGET,
    changeOrigin: true,
  })
);

// Serve built React app
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback — all routes return index.html
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`GreenPulse frontend on port ${PORT}`);
});
