const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy (required for Hostinger behind reverse proxy)
app.set('trust proxy', true);

// Log all requests in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'U-EventTrack Frontend',
    timestamp: new Date().toISOString() 
  });
});

// Redirect API requests to Laravel backend
// Laravel should be served directly by Apache at /backend/public/
app.use('/api', (req, res) => {
  // Use the same host the user is accessing
  const backendUrl = `${req.protocol}://${req.get('host')}/backend/public/api${req.url}`;
  console.log(`Redirecting API: ${req.url} -> ${backendUrl}`);
  res.redirect(307, backendUrl);
});

// Redirect storage requests to Laravel
app.use('/storage', (req, res) => {
  const storageUrl = `${req.protocol}://${req.get('host')}/backend/storage/app/public${req.url}`;
  res.redirect(307, storageUrl);
});

// Serve React static files from frontend/dist
const frontendPath = path.join(__dirname, 'frontend', 'dist');
app.use(express.static(frontendPath, {
  maxAge: '1d',
  etag: true
}));

// Serve React app for all other routes (SPA fallback)
app.get('*', (req, res) => {
  const indexPath = path.join(frontendPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving React app:', err);
      res.status(500).send('Frontend application not found. Please run "npm run build" first.');
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n🚀 U-EventTrack Frontend Server Started');
  console.log('=====================================');
  console.log(`📱 Frontend:        http://localhost:${PORT}`);
  console.log(`🔌 API (Apache):    http://localhost:${PORT}/backend/public/api`);
  console.log(`📦 Storage:         http://localhost:${PORT}/backend/storage/app/public`);
  console.log(`🏥 Health Check:    http://localhost:${PORT}/health`);
  console.log(`🌍 Environment:     ${process.env.NODE_ENV || 'development'}`);
  console.log('=====================================\n');
  console.log('⚠️  Note: Laravel backend is served by Apache at /backend/public/');
  console.log('    Make sure your .htaccess is configured correctly.\n');
});
