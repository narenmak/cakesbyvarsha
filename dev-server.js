const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const port = 8080;

// Serve static files
app.use(express.static('.'));

// Proxy API requests to local API server
app.use('/api', createProxyMiddleware({ 
  target: 'http://localhost:3000',
  changeOrigin: true
}));

app.listen(port, () => {
  console.log(`Development server running at http://localhost:${port}`);
});
