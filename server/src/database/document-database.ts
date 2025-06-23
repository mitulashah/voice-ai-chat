import initSqlJs, { Database } from 'sql.js';
import * as fs from 'fs';
import * as path from 'path';

export interface DocumentRecord {
  id: string;
  type: 'persona' | 'prompt_template' | 'scenario';
  name: string;
  document: string; // JSON string
  file_path: string;
  file_modified: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentStats {
  personas: number;
  templates: number;
  scenarios: number;
  total: number;
}

export class DocumentDatabase {
  protected db: Database | null = null;
  protected isInitialized = false;
  protected isFreshDatabase = false;
  private dbPath: string;

  constructor(dbPath?: string) {
    this.dbPath = dbPath || path.join(process.cwd(), 'data', 'voice-ai-documents.db');
    this.initializeDatabase();
  }
  private async initializeDatabase(): Promise<void> {
    try {
      const SQL = await initSqlJs();
      
      // Check if database file exists
      if (fs.existsSync(this.dbPath)) {
        // Load existing database
        const filebuffer = fs.readFileSync(this.dbPath);
        this.db = new SQL.Database(filebuffer);
        this.isFreshDatabase = false;
        console.log(`Loaded existing database from ${this.dbPath}`);
      } else {
        // Create new database
        this.db = new SQL.Database();
        this.isFreshDatabase = true;
        console.log(`Created new database at ${this.dbPath}`);
      }

      this.initializeSchema();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private initializeSchema(): void {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // Create documents table with JSON storage
    this.db.run(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK (type IN ('persona', 'prompt_template', 'scenario')),
        name TEXT NOT NULL,
        document TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_modified TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // Create indexes for performance
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_documents_name ON documents(name)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_documents_file_path ON documents(file_path)`);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_documents_type_name ON documents(type, name)`);

    // Create moods table for mood sync
    this.db.run(`
      CREATE TABLE IF NOT EXISTS moods (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mood TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);
    this.db.run(`CREATE INDEX IF NOT EXISTS idx_moods_mood ON moods(mood)`);

    console.log('Database schema initialized');
  }

  private ensureInitialized(): void {
    if (!this.isInitialized || !this.db) {
      throw new Error('Database not initialized. Please wait for initialization to complete.');
    }
  }

  private saveDatabase(): void {
    if (!this.db) return;
    
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Save database to file
      const data = this.db.export();
      fs.writeFileSync(this.dbPath, data);
    } catch (error) {
      console.error('Failed to save database:', error);
    }
  }

  // Document CRUD operations
  getAllPersonas(): any[] {
    this.ensureInitialized();
    
    const stmt = this.db!.prepare(`
      SELECT id, name, document 
      FROM documents 
      WHERE type = 'persona' 
      ORDER BY name
    `);
    
    const results: any[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push({
        id: row.id,
        name: row.name,
        ...JSON.parse(row.document as string)
      });
    }
    stmt.free();
    
    return results;
  }

  getPersonaById(id: string): any | null {
    this.ensureInitialized();
    
    const stmt = this.db!.prepare(`
      SELECT document 
      FROM documents 
      WHERE type = 'persona' AND id = ?
    `);
    
    stmt.bind([id]);
    
    if (stmt.step()) {
      const row = stmt.getAsObject();
      const result = JSON.parse(row.document as string);
      stmt.free();
      return result;
    }
    
    stmt.free();
    return null;
  }

  getAllTemplates(): any[] {
    this.ensureInitialized();
    
    const stmt = this.db!.prepare(`
      SELECT id, name, document 
      FROM documents 
      WHERE type = 'prompt_template' 
      ORDER BY name
    `);
    
    const results: any[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push({
        id: row.id,
        name: row.name,
        ...JSON.parse(row.document as string)
      });
    }
    stmt.free();
    
    return results;
  }

  getTemplateById(id: string): any | null {
    this.ensureInitialized();
    
    const stmt = this.db!.prepare(`
      SELECT document 
      FROM documents 
      WHERE type = 'prompt_template' AND id = ?
    `);
    
    stmt.bind([id]);
    
    if (stmt.step()) {
      const row = stmt.getAsObject();
      const result = JSON.parse(row.document as string);
      stmt.free();
      return result;
    }
    
    stmt.free();
    return null;
  }

  getAllScenarios(): any[] {
    this.ensureInitialized();
    const stmt = this.db!.prepare(`
      SELECT id, name, document 
      FROM documents 
      WHERE type = 'scenario' 
      ORDER BY name
    `);
    const results: any[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push({
        id: row.id,
        name: row.name,
        ...JSON.parse(row.document as string)
      });
    }
    stmt.free();
    return results;
  }

  getScenarioById(id: string): any | null {
    this.ensureInitialized();
    const stmt = this.db!.prepare(`
      SELECT document 
      FROM documents 
      WHERE type = 'scenario' AND id = ?
    `);
    stmt.bind([id]);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      const result = JSON.parse(row.document as string);
      stmt.free();
      return result;
    }
    stmt.free();
    return null;
  }

  // Generic document operations
  upsertDocument(
    id: string, 
    type: 'persona' | 'prompt_template' | 'scenario', 
    name: string, 
    document: any,
    filePath: string,
    fileModified: Date
  ): void {
    this.ensureInitialized();
    
    // Validate JSON before storing
    const jsonString = JSON.stringify(document);
    
    const stmt = this.db!.prepare(`
      INSERT OR REPLACE INTO documents 
      (id, type, name, document, file_path, file_modified, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    
    stmt.run([
      id, 
      type, 
      name, 
      jsonString, 
      filePath, 
      fileModified.toISOString()
    ]);
    stmt.free();
    
    // Save database to file
    this.saveDatabase();
  }

  deleteDocument(id: string, type: 'persona' | 'prompt_template' | 'scenario'): boolean {
    this.ensureInitialized();
    
    const stmt = this.db!.prepare(`
      DELETE FROM documents 
      WHERE id = ? AND type = ?
    `);
    
    stmt.run([id, type]);
    const changes = this.db!.getRowsModified();
    stmt.free();
    
    if (changes > 0) {
      this.saveDatabase();
      return true;
    }
    
    return false;
  }

  // Advanced search functionality
  searchDocuments(type: 'persona' | 'prompt_template' | 'scenario', searchTerm: string): any[] {
    this.ensureInitialized();
    const sql = `
      SELECT id, name, document 
      FROM documents 
      WHERE type = ? 
        AND (
          LOWER(name) LIKE LOWER(?) 
          OR LOWER(document) LIKE LOWER(?)
        )
      ORDER BY name
    `;
    const searchPattern = `%${searchTerm}%`;
    console.log('DEBUG: Running searchDocuments SQL:', sql.replace(/\n/g, ' '));
    console.log('DEBUG: Bind params:', [type, searchPattern, searchPattern]);
    const stmt = this.db!.prepare(sql);
    stmt.bind([type, searchPattern, searchPattern]);
    const results: any[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push({
        id: row.id,
        name: row.name,
        ...JSON.parse(row.document as string)
      });
    }
    stmt.free();
    console.log('DEBUG: searchDocuments found', results.length, 'results');
    return results;
  }

  // Get document statistics
  getDocumentStats(): DocumentStats {
    this.ensureInitialized();
    
    const stmt = this.db!.prepare(`
      SELECT 
        type,
        COUNT(*) as count
      FROM documents 
      GROUP BY type
    `);
    
    const stats: DocumentStats = { personas: 0, templates: 0, scenarios: 0, total: 0 };
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      if (row.type === 'persona') stats.personas = row.count as number;
      if (row.type === 'prompt_template') stats.templates = row.count as number;
      if (row.type === 'scenario') stats.scenarios = row.count as number;
      stats.total += row.count as number;
    }
    stmt.free();
    
    return stats;
  }

  // Get all documents (for debugging/admin purposes)
  getAllDocuments(): DocumentRecord[] {
    this.ensureInitialized();
    
    const stmt = this.db!.prepare('SELECT * FROM documents ORDER BY type, name');
    
    const results: DocumentRecord[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push({
        id: row.id as string,
        type: row.type as 'persona' | 'prompt_template' | 'scenario',
        name: row.name as string,
        document: row.document as string,
        file_path: row.file_path as string,
        file_modified: row.file_modified as string,
        created_at: row.created_at as string,
        updated_at: row.updated_at as string
      });
    }
    stmt.free();
    
    return results;
  }

  // Public: Get all template IDs and names
  getAllTemplateNames(): { id: string; name: string }[] {
    this.ensureInitialized();
    const stmt = this.db!.prepare(`SELECT id, name FROM documents WHERE type = 'prompt_template'`);
    const names: { id: string; name: string }[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      names.push({ id: String(row.id), name: String(row.name) });
    }
    stmt.free();
    return names;
  }

  // === MOOD OPERATIONS ===

  getAllMoods(): { mood: string; description: string }[] {
    this.ensureInitialized();
    const result = this.db!.exec('SELECT mood, description FROM moods');
    if (!result[0]) return [];
    
    return result[0].values.map(([mood, description]) => ({
      mood: String(mood),
      description: String(description)
    }));
  }

  getMoodById(id: string): { id: string; mood: string; description: string } | null {
    this.ensureInitialized();
    const result = this.db!.exec('SELECT mood, description FROM moods WHERE mood = ?', [id]);
    
    if (!result[0] || !result[0].values[0]) {
      return null;
    }
    
    const [mood, description] = result[0].values[0];
    return {
      id: String(mood),
      mood: String(mood),
      description: String(description)
    };
  }
  createMood(moodData: { id: string; mood: string; description?: string }): void {
    this.ensureInitialized();
    try {
      this.db!.run('INSERT INTO moods (mood, description) VALUES (?, ?)', [
        moodData.mood, 
        moodData.description || ''
      ]);
    } catch (error) {
      console.error('[createMood] Error:', error);
      throw error;
    }
  }

  updateMood(id: string, moodData: { mood: string; description?: string }): void {
    this.ensureInitialized();
    try {
      // First check if the mood exists
      const existsResult = this.db!.exec('SELECT COUNT(*) as count FROM moods WHERE mood = ?', [id]);
      const count = existsResult[0]?.values[0]?.[0];
      const exists = count && Number(count) > 0;
      
      if (!exists) {
        throw new Error(`Mood with id '${id}' not found`);
      }
        // Update the mood
      this.db!.run('UPDATE moods SET mood = ?, description = ? WHERE mood = ?', [
        moodData.mood, 
        moodData.description || '', 
        id
      ]);
    } catch (error) {
      console.error('[updateMood] Error:', error);
      throw error;
    }
  }

  deleteMood(id: string): void {
    this.ensureInitialized();
    try {
      // First check if the mood exists
      const existsResult = this.db!.exec('SELECT COUNT(*) as count FROM moods WHERE mood = ?', [id]);
      const count = existsResult[0]?.values[0]?.[0];
      const exists = count && Number(count) > 0;
      
      if (!exists) {
        throw new Error(`Mood with id '${id}' not found`);
      }
      
      // Delete the mood
      this.db!.run('DELETE FROM moods WHERE mood = ?', [id]);
    } catch (error) {
      console.error('[deleteMood] Error:', error);
      throw error;
    }
  }

  // Check if this is a fresh database (newly created)
  isFreshInit(): boolean {
    return this.isFreshDatabase;
  }

  // Check if database is ready
  isReady(): boolean {
    return this.isInitialized && this.db !== null;
  }

  close(): void {
    if (this.db) {
      this.saveDatabase();
      this.db.close();
      this.db = null;
      this.isInitialized = false;
      console.log('Database closed');
    }
  }
}
