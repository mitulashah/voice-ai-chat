import { Router, Request, Response } from 'express';
import { getAllPersonas, getPersonaById, searchPersonas, getPersonasByAgeGroup } from '../services/personaService';
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

// GET /api/personas/search - Search personas by query parameter (?q=term)
router.get('/search', async (req: Request, res: Response) => {
  try {
    const searchTerm = req.query.q as string;
    if (!searchTerm) {
      res.status(400).json({ 
        success: false, 
        error: 'Search term is required. Use /search?q=term.' 
      });
      return;
    }
    const personas = searchPersonas(searchTerm);
    res.json({ 
      success: true, 
      personas, 
      count: personas.length,
      searchTerm,
      searchMethod: 'query'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to search personas', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// GET /api/personas/search/:term - Search personas by path parameter
router.get('/search/:term', async (req: Request, res: Response) => {
  try {
    const searchTerm = req.params.term;
    if (!searchTerm) {
      res.status(400).json({ 
        success: false, 
        error: 'Search term is required. Use /search/:term.' 
      });
      return;
    }
    const personas = searchPersonas(searchTerm);
    res.json({ 
      success: true, 
      personas, 
      count: personas.length,
      searchTerm,
      searchMethod: 'path'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to search personas', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// GET /api/personas/age-group/:ageGroup - Filter personas by age group (new database feature)
router.get('/age-group/:ageGroup', async (req: Request, res: Response) => {
  try {
    const ageGroup = req.params.ageGroup;
    const personas = getPersonasByAgeGroup(ageGroup);
    res.json({ 
      success: true, 
      personas, 
      count: personas.length,
      ageGroup
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to filter personas by age group', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// GET /api/personas/:id - Get a single persona by id (must come after specific routes)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    // Skip if this looks like a search or other special route that wasn't caught above
    const id = req.params.id;
    if (id === 'search' || id === 'age-group') {
      res.status(400).json({ 
        success: false, 
        error: `Invalid persona ID: ${id}. Use /search?q=term for searching or /age-group/:group for filtering.` 
      });
      return;
    }
    
    const persona: Persona | null = getPersonaById(id);
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
