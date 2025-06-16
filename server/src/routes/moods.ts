import { Router, Request, Response } from 'express';
import { databaseServiceFactory } from '../services/database-service-factory';
import { FileSyncDatabase } from '../database/file-sync-database';

const router = Router();

// GET /api/moods - List all moods
router.get('/', async (_req: Request, res: Response) => {
  try {
    // Use the shared FileSyncDatabase instance from the service factory
    const db = databaseServiceFactory.getDatabase();
    let moods: { mood: string; description: string }[] = [];
    if (db instanceof FileSyncDatabase) {
      moods = db.getAllMoods();
    }
    res.json({ success: true, moods, count: moods.length });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load moods', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;
