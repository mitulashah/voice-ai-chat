import { Router, Request, Response } from 'express';
import { getAllScenarios, getScenarioById } from '../services/scenarioService';

console.log('Scenarios router loaded');

const router = Router();

// GET /api/scenarios - List all scenarios
router.get('/', async (_req: Request, res: Response) => {
  try {
    const scenarios = await getAllScenarios();
    res.json({ success: true, scenarios, count: scenarios.length });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load scenarios', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// GET /api/scenarios/:id - Get scenario by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const scenario = await getScenarioById(req.params.id);
    if (!scenario) {
      res.status(404).json({ success: false, error: 'Scenario not found' });
      return;
    }
    res.json({ success: true, scenario });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load scenario', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;
