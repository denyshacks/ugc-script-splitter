import express from 'express';
import openaiService from '../services/openaiService.js';

const router = express.Router();

// In-memory storage for background tasks (in production, use Redis or database)
const backgroundTasks = new Map();

// Background task processing
async function processBackgroundTask(taskId, params) {
  try {
    console.log(`[Background] Processing task ${taskId}`);
    const segment = await openaiService.generateContinuationSegment(params);
    
    backgroundTasks.set(taskId, {
      status: 'completed',
      result: { success: true, segment },
      completedAt: new Date()
    });
    
    console.log(`[Background] Task ${taskId} completed successfully`);
  } catch (error) {
    console.error(`[Background] Task ${taskId} failed:`, error);
    
    backgroundTasks.set(taskId, {
      status: 'failed',
      error: {
        message: error.message,
        type: error.message.includes('timed out') ? 'timeout' : 
               error.message.includes('API key') ? 'auth' : 'unknown'
      },
      completedAt: new Date()
    });
  }
}

// Start background task
router.post('/generate-continuation', async (req, res) => {
  console.log('[API] /generate-continuation called - using background processing');
  
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
    
    // Generate unique task ID
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store task as pending
    backgroundTasks.set(taskId, {
      status: 'processing',
      startedAt: new Date(),
      params: { imageUrl, script, voiceProfile, previousSegment, maintainEnergy, product }
    });
    
    // Start background processing (don't await)
    processBackgroundTask(taskId, {
      imageUrl, script, voiceProfile, previousSegment, maintainEnergy, product
    }).catch(err => console.error('Background task error:', err));
    
    console.log(`[API] Started background task ${taskId}`);
    
    // Return immediately with task ID
    res.json({ 
      success: true,
      taskId,
      status: 'processing',
      message: 'Task started. Use the task ID to check status.',
      checkStatusUrl: `/api/task-status/${taskId}`
    });
    
  } catch (error) {
    console.error('[API] Continuation generation error:', error);
    res.status(500).json({ 
      error: 'Failed to start continuation generation',
      message: error.message 
    });
  }
});

// Check task status
router.get('/task-status/:taskId', (req, res) => {
  const { taskId } = req.params;
  const task = backgroundTasks.get(taskId);
  
  if (!task) {
    return res.status(404).json({
      error: 'Task not found',
      message: 'Invalid task ID or task expired'
    });
  }
  
  if (task.status === 'processing') {
    return res.json({
      status: 'processing',
      message: 'Task is still processing. Please check again in a few seconds.',
      startedAt: task.startedAt
    });
  }
  
  if (task.status === 'completed') {
    // Clean up completed task after returning result
    setTimeout(() => backgroundTasks.delete(taskId), 5000);
    
    return res.json({
      status: 'completed',
      ...task.result,
      completedAt: task.completedAt
    });
  }
  
  if (task.status === 'failed') {
    // Clean up failed task after returning error
    setTimeout(() => backgroundTasks.delete(taskId), 5000);
    
    return res.status(500).json({
      status: 'failed',
      error: task.error.type === 'timeout' ? 'Request timeout' :
             task.error.type === 'auth' ? 'Authentication error' :
             'Processing failed',
      message: task.error.message,
      completedAt: task.completedAt
    });
  }
});

export default router;