"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentDatabase = void 0;
const sql_js_1 = __importDefault(require("sql.js"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class DocumentDatabase {
    constructor(dbPath) {
        this.db = null;
        this.isInitialized = false;
        this.dbPath = dbPath || path.join(process.cwd(), 'data', 'voice-ai-documents.db');
        this.initializeDatabase();
    }
    initializeDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const SQL = yield (0, sql_js_1.default)();
                // Check if database file exists
                if (fs.existsSync(this.dbPath)) {
                    // Load existing database
                    const filebuffer = fs.readFileSync(this.dbPath);
                    this.db = new SQL.Database(filebuffer);
                    console.log(`Loaded existing database from ${this.dbPath}`);
                }
                else {
                    // Create new database
                    this.db = new SQL.Database();
                    console.log(`Created new database at ${this.dbPath}`);
                }
                this.initializeSchema();
                this.isInitialized = true;
            }
            catch (error) {
                console.error('Failed to initialize database:', error);
                throw error;
            }
        });
    }
    initializeSchema() {
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
    ensureInitialized() {
        if (!this.isInitialized || !this.db) {
            throw new Error('Database not initialized. Please wait for initialization to complete.');
        }
    }
    saveDatabase() {
        if (!this.db)
            return;
        try {
            // Ensure data directory exists
            const dataDir = path.dirname(this.dbPath);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            // Save database to file
            const data = this.db.export();
            fs.writeFileSync(this.dbPath, data);
        }
        catch (error) {
            console.error('Failed to save database:', error);
        }
    }
    // Document CRUD operations
    getAllPersonas() {
        this.ensureInitialized();
        const stmt = this.db.prepare(`
      SELECT id, name, document 
      FROM documents 
      WHERE type = 'persona' 
      ORDER BY name
    `);
        const results = [];
        while (stmt.step()) {
            const row = stmt.getAsObject();
            results.push(Object.assign({ id: row.id, name: row.name }, JSON.parse(row.document)));
        }
        stmt.free();
        return results;
    }
    getPersonaById(id) {
        this.ensureInitialized();
        const stmt = this.db.prepare(`
      SELECT document 
      FROM documents 
      WHERE type = 'persona' AND id = ?
    `);
        stmt.bind([id]);
        if (stmt.step()) {
            const row = stmt.getAsObject();
            const result = JSON.parse(row.document);
            stmt.free();
            return result;
        }
        stmt.free();
        return null;
    }
    getAllTemplates() {
        this.ensureInitialized();
        const stmt = this.db.prepare(`
      SELECT id, name, document 
      FROM documents 
      WHERE type = 'prompt_template' 
      ORDER BY name
    `);
        const results = [];
        while (stmt.step()) {
            const row = stmt.getAsObject();
            results.push(Object.assign({ id: row.id, name: row.name }, JSON.parse(row.document)));
        }
        stmt.free();
        return results;
    }
    getTemplateById(id) {
        this.ensureInitialized();
        const stmt = this.db.prepare(`
      SELECT document 
      FROM documents 
      WHERE type = 'prompt_template' AND id = ?
    `);
        stmt.bind([id]);
        if (stmt.step()) {
            const row = stmt.getAsObject();
            const result = JSON.parse(row.document);
            stmt.free();
            return result;
        }
        stmt.free();
        return null;
    }
    getAllScenarios() {
        this.ensureInitialized();
        const stmt = this.db.prepare(`
      SELECT id, name, document 
      FROM documents 
      WHERE type = 'scenario' 
      ORDER BY name
    `);
        const results = [];
        while (stmt.step()) {
            const row = stmt.getAsObject();
            results.push(Object.assign({ id: row.id, name: row.name }, JSON.parse(row.document)));
        }
        stmt.free();
        return results;
    }
    getScenarioById(id) {
        this.ensureInitialized();
        const stmt = this.db.prepare(`
      SELECT document 
      FROM documents 
      WHERE type = 'scenario' AND id = ?
    `);
        stmt.bind([id]);
        if (stmt.step()) {
            const row = stmt.getAsObject();
            const result = JSON.parse(row.document);
            stmt.free();
            return result;
        }
        stmt.free();
        return null;
    }
    // Generic document operations
    upsertDocument(id, type, name, document, filePath, fileModified) {
        this.ensureInitialized();
        // Validate JSON before storing
        const jsonString = JSON.stringify(document);
        const stmt = this.db.prepare(`
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
    deleteDocument(id, type) {
        this.ensureInitialized();
        const stmt = this.db.prepare(`
      DELETE FROM documents 
      WHERE id = ? AND type = ?
    `);
        stmt.run([id, type]);
        const changes = this.db.getRowsModified();
        stmt.free();
        if (changes > 0) {
            this.saveDatabase();
            return true;
        }
        return false;
    }
    // Advanced search functionality
    searchDocuments(type, searchTerm) {
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
        const stmt = this.db.prepare(sql);
        stmt.bind([type, searchPattern, searchPattern]);
        const results = [];
        while (stmt.step()) {
            const row = stmt.getAsObject();
            results.push(Object.assign({ id: row.id, name: row.name }, JSON.parse(row.document)));
        }
        stmt.free();
        console.log('DEBUG: searchDocuments found', results.length, 'results');
        return results;
    }
    // Get document statistics
    getDocumentStats() {
        this.ensureInitialized();
        const stmt = this.db.prepare(`
      SELECT 
        type,
        COUNT(*) as count
      FROM documents 
      GROUP BY type
    `);
        const stats = { personas: 0, templates: 0, scenarios: 0, total: 0 };
        while (stmt.step()) {
            const row = stmt.getAsObject();
            if (row.type === 'persona')
                stats.personas = row.count;
            if (row.type === 'prompt_template')
                stats.templates = row.count;
            if (row.type === 'scenario')
                stats.scenarios = row.count;
            stats.total += row.count;
        }
        stmt.free();
        return stats;
    }
    // Get all documents (for debugging/admin purposes)
    getAllDocuments() {
        this.ensureInitialized();
        const stmt = this.db.prepare('SELECT * FROM documents ORDER BY type, name');
        const results = [];
        while (stmt.step()) {
            const row = stmt.getAsObject();
            results.push({
                id: row.id,
                type: row.type,
                name: row.name,
                document: row.document,
                file_path: row.file_path,
                file_modified: row.file_modified,
                created_at: row.created_at,
                updated_at: row.updated_at
            });
        }
        stmt.free();
        return results;
    }
    // Public: Get all template IDs and names
    getAllTemplateNames() {
        this.ensureInitialized();
        const stmt = this.db.prepare(`SELECT id, name FROM documents WHERE type = 'prompt_template'`);
        const names = [];
        while (stmt.step()) {
            const row = stmt.getAsObject();
            names.push({ id: String(row.id), name: String(row.name) });
        }
        stmt.free();
        return names;
    }
    // Check if database is ready
    isReady() {
        return this.isInitialized && this.db !== null;
    }
    close() {
        if (this.db) {
            this.saveDatabase();
            this.db.close();
            this.db = null;
            this.isInitialized = false;
            console.log('Database closed');
        }
    }
}
exports.DocumentDatabase = DocumentDatabase;
