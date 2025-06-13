import { Router, Request, Response } from 'express';
import { getAllPersonas, getPersonaById } from '../services/personaService';
import type { Persona } from '../types/api';

console.log('Personas router loaded');

const router = Router();

// TEST route
router.get('/test', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Personas router test route hit' });
});

// GET /api/personas - List all personas
router.get('/', async (_req: Request, res: Response) => {
  try {
    const personas: Persona[] = getAllPersonas();
    res.json({ success: true, personas, count: personas.length });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load personas', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// GET /api/personas/:id - Get a single persona by id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const persona: Persona | null = getPersonaById(req.params.id);
    if (!persona) {
      res.status(404).json({ success: false, error: 'Persona not found' });
      return;
    }
    res.json({ success: true, persona });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load persona', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;
