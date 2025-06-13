import { Router, Request, Response } from 'express';
import { getChatCompletion } from '../services/chatService';
import type { ChatMessage, ChatRequest, ChatResponse } from '../types/api';

const router = Router();

// POST /api/chat - Chat completion endpoint
router.post('/', async (req: Request<any, any, ChatRequest>, res: Response<ChatResponse>) => {
  try {
    const { messages }: ChatRequest = req.body;
    const result = await getChatCompletion(messages);
    // Ensure content is always a string and include usage data
    res.json({ 
      role: 'assistant',
      content: result.content ?? '',
      usage: result.usage
    });
  } catch (error) {
    res.json({ 
      role: 'assistant', 
      content: 'Sorry, I encountered an error processing your request. Please try again.' 
    });
  }
});

export default router;
