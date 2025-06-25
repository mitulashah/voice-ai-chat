import { FileSyncDatabase } from '../database/file-sync-database';
import { DocumentDatabase } from '../database/document-database';
import { DocumentService } from './DocumentService';
import * as path from 'path';
import * as fs from 'fs';

export interface DatabaseServiceConfig {
  useDatabaseByDefault: boolean;
  fallbackToFiles: boolean;
  dbPath?: string;
  personasDir: string;
  templatesDir: string;
}

/**
 * Factory class for creating database-backed or file-backed services
 * based on environment and configuration
 */
export class DatabaseServiceFactory {
  private static instance: DatabaseServiceFactory;
  private database: FileSyncDatabase | DocumentDatabase | null = null;
  private documentService: DocumentService | null = null;
  private config: DatabaseServiceConfig;
  private initializationPromise: Promise<void> | null = null;
  private initializationError: Error | null = null;

  private constructor() {    // Default configuration
    this.config = {
      useDatabaseByDefault: process.env.NODE_ENV !== 'development',
      fallbackToFiles: true,
      dbPath: process.env.DATABASE_PATH,
      personasDir: path.join(process.cwd(), 'src', 'personas'),
      templatesDir: path.join(process.cwd(), 'src', 'prompts')
    };
  }

  public static getInstance(): DatabaseServiceFactory {
    if (!DatabaseServiceFactory.instance) {
      DatabaseServiceFactory.instance = new DatabaseServiceFactory();
    }
    return DatabaseServiceFactory.instance;
  }

  public configure(config: Partial<DatabaseServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public async initializeDatabase(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._initializeDatabase();
    return this.initializationPromise;
  }

  private async _initializeDatabase(): Promise<void> {
    try {
      console.log('🔧 Initializing database service...');
      const dbPath = this.config.dbPath || path.join(process.cwd(), 'data', 'voice-ai-documents.db');
      // Ensure the data directory exists before initializing the database
      const dataDir = path.dirname(dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      if (this.config.useDatabaseByDefault) {
        // Production: Use FileSyncDatabase for live file watching
        this.database = new FileSyncDatabase(dbPath, {
          personasDir: this.config.personasDir,
          templatesDir: this.config.templatesDir,
          watchFiles: true,
          syncOnStartup: true
        });
        if (this.database instanceof FileSyncDatabase) {
          await this.database.initialize();
        }
        console.log('📊 Using FileSyncDatabase (production mode)');
      } else {
        // Development: Use FileSyncDatabase for hot reloading
        this.database = new FileSyncDatabase(dbPath, {
          personasDir: this.config.personasDir,
          templatesDir: this.config.templatesDir,
          watchFiles: true,
          syncOnStartup: true
        });
        if (this.database instanceof FileSyncDatabase) {
          await this.database.initialize();
        }
        console.log('🔥 Using FileSyncDatabase (development mode)');
      }

      // Wait for database to be ready
      let retries = 0;
      while (!this.database.isReady() && retries < 100) {
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }      if (!this.database.isReady()) {
        throw new Error('Database failed to initialize within timeout');
      }

      // Initialize DocumentService if we have a DocumentDatabase
      if (this.database instanceof DocumentDatabase) {
        this.documentService = new DocumentService(this.database);
        console.log('📋 DocumentService initialized successfully');
      }

      console.log('✅ Database service initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize database service:', error);
      this.initializationError = error as Error;
      
      if (this.config.fallbackToFiles) {
        console.log('🔄 Falling back to file-based services');
        this.database = null;
      } else {
        throw error;
      }
    }
  }

  public async initializeDatabaseWithSeedData(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._initializeWithSeedData();
    return this.initializationPromise;
  }  private async _initializeWithSeedData(): Promise<void> {
    try {
      console.log('🗃️  Initializing database with seed data approach...');
      
      // Always use DocumentDatabase (no file watchers)
      const dbPath = this.config.dbPath || path.join(process.cwd(), 'data', 'voice-ai-documents.db');
      
      // Check SKIP_RESTORE environment variable
      const skipRestore = process.env.SKIP_RESTORE === 'true';
      console.log(`🔄 SKIP_RESTORE environment variable: ${skipRestore}`);
        const docDatabase = await DocumentDatabase.create(dbPath, skipRestore);
        // Check if database is empty (needs seeding) OR if SKIP_RESTORE is true (force fresh seeding)
      const stats = docDatabase.getDocumentStats();
      const isEmpty = stats.total === 0;
      const forceSeeding = skipRestore; // Force seeding when SKIP_RESTORE=true
      
      if (isEmpty || forceSeeding) {
        if (forceSeeding) {
          console.log('🔄 SKIP_RESTORE=true, forcing fresh seeding from files...');
        } else {
          console.log('📁 Database is empty, seeding from files...');
        }
        const { DatabaseMigration } = await import('../database/migration');
        const migration = await DatabaseMigration.create(dbPath);
        const result = await migration.migrateFromFiles();
          if (result.success) {
          console.log(`✅ Seeded database: ${result.personasCount} personas, ${result.templatesCount} templates, ${result.moodsCount} moods, ${result.scenariosCount} scenarios`);
        } else {
          console.warn(`⚠️  Seeding completed with ${result.errors.length} errors`);
        }
      } else {
        console.log(`🗃️  Database already populated (${stats.total} documents), skipping seed`);
      }
      
      // Set the database instance (this was incorrectly indented inside the if block)
      this.database = docDatabase;
      
      // Initialize DocumentService with the database
      this.documentService = new DocumentService(docDatabase);
      console.log('📋 DocumentService initialized successfully');
      
      console.log('✅ Database ready for CRUD operations');
      
    } catch (error) {
      this.initializationError = error as Error;
      console.error('❌ Database initialization failed:', error);
      
      // No fallback to files - pure database approach
      throw error;
    }
  }
  public getDatabase(): FileSyncDatabase | DocumentDatabase | null {
    return this.database;
  }

  public getDocumentService(): DocumentService | null {
    return this.documentService;
  }

  public isDatabaseReady(): boolean {
    return this.database?.isReady() ?? false;
  }

  public shouldUseDatabase(): boolean {
    return this.isDatabaseReady();
  }

  public getInitializationError(): Error | null {
    return this.initializationError;
  }
  public async close(): Promise<void> {
    if (this.database) {
      console.log('🛑 Closing database service...');
      this.database.close();
      this.database = null;
    }
    this.documentService = null;
    this.initializationPromise = null;
    this.initializationError = null;
  }

  // File-based fallback utilities
  public resolvePersonasDir(): string {
    const distPath = path.join(__dirname, '..', 'personas');
    if (fs.existsSync(distPath)) return distPath;
    const srcPath = path.join(__dirname, '..', '..', 'src', 'personas');
    if (fs.existsSync(srcPath)) return srcPath;
    throw new Error('Personas directory not found');
  }

  public resolvePromptsDir(): string {
    const distPath = path.join(__dirname, '..', 'prompts');
    if (fs.existsSync(distPath)) return distPath;
    const srcPath = path.join(__dirname, '..', '..', 'src', 'prompts');
    if (fs.existsSync(srcPath)) return srcPath;
    throw new Error('Prompts directory not found');
  }
}

// Singleton instance
export const databaseServiceFactory = DatabaseServiceFactory.getInstance();
