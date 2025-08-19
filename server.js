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
      '/api/test-continuation',
      '/api/generate',
      '/api/generate-continuation',
      '/api/task-status/:taskId',
      '/api/generate-plus',
      '/api/generate-new-cont',
      '/api/download',
      '/api/generate-videos'
    ],
    timestamp: new Date()
  });
});

// Test endpoint for continuation without OpenAI call
app.post('/api/test-continuation', (req, res) => {
  console.log('[API] /test-continuation called - no OpenAI, just testing');
  
  try {
    const { imageUrl, script, voiceProfile, product } = req.body;
    
    // Validate required fields
    if (!imageUrl || !script || !voiceProfile || !product) {
      return res.status(400).json({ 
        error: 'Missing required fields: imageUrl, script, voiceProfile, and product are required' 
      });
    }
    
    // Check environment variables
    const envCheck = {
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      hasGemini: !!process.env.GOOGLE_GEMINI_API_KEY,
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT
    };
    
    // Return mock response to test the flow
    const mockSegment = {
      character_description: {
        voice_matching: "Test voice profile",
        visual_details: "Test character from image",
        behavior_notes: "Test behavior"
      },
      action_timeline: {
        dialogue: script.substring(0, 100) + "...",
        action_description: "Test action description",
        camera_direction: "Medium shot, eye-level"
      }
    };
    
    console.log('[API] Test continuation successful');
    
    res.json({ 
      success: true,
      segment: mockSegment,
      debug: {
        receivedData: {
          imageUrl: !!imageUrl,
          scriptLength: script.length,
          hasVoiceProfile: !!voiceProfile,
          product
        },
        environment: envCheck
      }
    });
    
  } catch (error) {
    console.error('[API] Test continuation error:', error);
    res.status(500).json({ 
      error: 'Test endpoint failed',
      message: error.message 
    });
  }
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