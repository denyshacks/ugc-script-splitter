import dotenv from 'dotenv';
// Load environment variables FIRST before importing other modules
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import generateRoute from './api/routes/generate.js';
import generateContinuationRoute from './api/routes/generateContinuation.js';
import generatePlusRoute from './api/routes/generate.plus.js';
import generateNewContRoute from './api/routes/generate.newcont.js';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Add request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API Routes (before static files)
app.use('/api', generateRoute);
app.use('/api', generateContinuationRoute);
app.use('/api', generatePlusRoute);
app.use('/api', generateNewContRoute);

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'build')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasGemini: !!process.env.GOOGLE_GEMINI_API_KEY,
      hasKieAI: !!process.env.KIEAI_API_KEY
    }
  });
});

// Debug endpoint to test API routes
app.get('/api/debug', (req, res) => {
  res.json({
    message: 'API routes are working',
    availableRoutes: [
      '/api/health',
      '/api/debug',
      '/api/generate',
      '/api/generate-continuation',
      '/api/generate-plus',
      '/api/generate-new-cont',
      '/api/download',
      '/api/generate-videos'
    ],
    timestamp: new Date()
  });
});

// Catch all handler - send React app for any route not handled above
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'build', 'index.html');
  console.log(`Serving React app from: ${indexPath}`);
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).send('Error loading application');
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Build directory: ${path.join(__dirname, 'build')}`);
});