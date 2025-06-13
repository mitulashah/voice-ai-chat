import { Router, Request, Response } from 'express';
import { getAllTemplates } from '../services/templateService';
import type { Template } from '../types/api';

const router = Router();

// GET /api/templates - List all templates
router.get('/', async (_req: Request, res: Response) => {
  try {
    const templates: Template[] = getAllTemplates();
    res.json({ success: true, templates, count: templates.length });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load available templates', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;
