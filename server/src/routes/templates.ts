import { Router, Request, Response } from 'express';
import { getAllTemplates, getTemplateById, searchTemplates, getTemplatesByModel, getAllTemplateNames } from '../services/templateService';
import type { Template } from '../types/api';
import { databaseServiceFactory } from '../services/database-service-factory';

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

// GET /api/templates/search - Search templates by query parameter (?q=term)
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
    const templates = searchTemplates(searchTerm);
    res.json({ 
      success: true, 
      templates, 
      count: templates.length,
      searchTerm,
      searchMethod: 'query'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to search templates', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// GET /api/templates/search/:term - Search templates by path parameter
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
    const templates = searchTemplates(searchTerm);
    res.json({ 
      success: true, 
      templates, 
      count: templates.length,
      searchTerm,
      searchMethod: 'path'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to search templates', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// GET /api/templates/model/:modelType - Filter templates by model type (new database feature)
router.get('/model/:modelType', async (req: Request, res: Response) => {
  try {
    const modelType = req.params.modelType;
    const templates = getTemplatesByModel(modelType);
    res.json({ 
      success: true, 
      templates, 
      count: templates.length,
      modelType
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to filter templates by model type', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// GET /api/templates/debug-names - List all template IDs and names in the database
router.get('/debug-names', async (_req: Request, res: Response) => {
  try {
    const names = await getAllTemplateNames();
    if (names) {
      res.json({ success: true, templates: names });
      return;
    }
    res.status(404).json({ success: false, error: 'Database not in use or debug method missing.' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get template names', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// GET /api/templates/:id - Get a single template by id (must come after specific routes)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    // Skip if this looks like a search or other special route that wasn't caught above
    const id = req.params.id;
    if (id === 'search' || id === 'model') {
      res.status(400).json({ 
        success: false, 
        error: `Invalid template ID: ${id}. Use /search?q=term for searching or /model/:type for filtering.` 
      });
      return;
    }
    
    const template = getTemplateById(id);
    if (!template) {
      res.status(404).json({ success: false, error: 'Template not found' });
      return;
    }
    res.json({ success: true, template });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load template', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;
