import express from 'express';
import openaiService from '../services/openaiService.js';

const router = express.Router();

router.post('/generate-continuation', async (req, res) => {
  console.log('[API] /generate-continuation called');
  
  // Set a longer timeout for this endpoint
  req.setTimeout(95000); // 95 seconds
  
  try {
    const { imageUrl, script, voiceProfile, previousSegment, maintainEnergy, product } = req.body;
    
    // Validate required fields
    if (!imageUrl || !script || !voiceProfile || !product) {
      return res.status(400).json({ 
        error: 'Missing required fields: imageUrl, script, voiceProfile, and product are required' 
      });
    }
    
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: 'OpenAI API key not configured',
        message: 'Server configuration error: Missing OpenAI API key'
      });
    }
    
    console.log('[API] Generating continuation for:', {
      imageUrl,
      scriptLength: script.length,
      hasVoiceProfile: !!voiceProfile,
      hasPreviousSegment: !!previousSegment,
      product
    });
    
    // Generate continuation segment with timeout handling
    const segment = await openaiService.generateContinuationSegment({
      imageUrl,
      script,
      voiceProfile,
      previousSegment,
      maintainEnergy,
      product
    });
    
    console.log('[API] Continuation segment generated successfully');
    
    res.json({ 
      success: true,
      segment
    });
    
  } catch (error) {
    console.error('[API] Continuation generation error:', error);
    
    // Handle different types of errors
    if (error.message.includes('timed out')) {
      res.status(408).json({ 
        error: 'Request timeout',
        message: 'The AI service took too long to respond. Please try again with a shorter script or simpler request.' 
      });
    } else if (error.message.includes('API key')) {
      res.status(401).json({
        error: 'Authentication error',
        message: 'Invalid or missing OpenAI API key'
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to generate continuation',
        message: error.message 
      });
    }
  }
});

export default router;