import { DocumentDatabase } from './document-database';
import { SyncUtils } from './sync-utils';
import chokidar, { FSWatcher } from 'chokidar';
import fs from 'fs/promises';
import path from 'path';

export interface FileSyncOptions {
  personasDir?: string;
  templatesDir?: string;
  watchFiles?: boolean;
  syncOnStartup?: boolean;
}

export class FileSyncDatabase extends DocumentDatabase {
  private personasDir: string;
  private templatesDir: string;
  private watchFiles: boolean;
  private syncOnStartup: boolean;
  private watchers: FSWatcher[] = [];

  constructor(dbPath: string, options?: FileSyncOptions) {
    super(dbPath);
    this.personasDir = options?.personasDir || path.join(process.cwd(), 'src', 'personas');
    this.templatesDir = options?.templatesDir || path.join(process.cwd(), 'src', 'prompts');
    this.watchFiles = options?.watchFiles ?? true;
    this.syncOnStartup = options?.syncOnStartup ?? true;
  }

  async initialize(): Promise<void> {
    if (this.syncOnStartup) {
      console.log('🔄 Starting initial file sync...');
      await this.syncAllFiles();
      console.log('✅ Initial file sync completed');
    }
    if (this.watchFiles) {
      console.log('👁️  Starting file watchers...');
      this.startFileWatchers();
      console.log('✅ File watchers started');
    }
  }

  async close(): Promise<void> {
    for (const watcher of this.watchers) {
      await watcher.close();
    }
    this.watchers = [];
    await super.close();
  }

  private async syncAllFiles(): Promise<void> {
    try {
      await this.syncPersonas();
      await this.syncTemplates();
    } catch (error) {
      console.error('❌ Error during file sync:', error);
      throw error;
    }
  }

  private async syncPersonas(): Promise<void> {
    try {
      const files = await fs.readdir(this.personasDir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      const fileIds = new Set(jsonFiles.map(f => path.basename(f, '.json')));
      console.log(`📂 Found ${jsonFiles.length} persona files to sync`);
      for (const file of jsonFiles) {
        await this.syncPersonaFile(path.join(this.personasDir, file));
      }
      // Remove personas from DB that no longer exist on disk
      const dbPersonas = this.getAllPersonas();
      for (const persona of dbPersonas) {
        if (!fileIds.has(persona.id)) {
          this.deleteDocument(persona.id, 'persona');
          console.log(`🗑️  Removed stale persona from DB: ${persona.id}`);
        }
      }
    } catch (error) {
      console.error('❌ Error syncing personas:', error);
      throw error;
    }
  }

  private async syncTemplates(): Promise<void> {
    try {
      const files = await fs.readdir(this.templatesDir);
      const promptyFiles = files.filter(f => f.endsWith('.prompty'));
      const fileIds = new Set(promptyFiles.map(f => path.basename(f, '.prompty')));
      console.log(`📂 Found ${promptyFiles.length} template files to sync`);
      for (const file of promptyFiles) {
        await this.syncTemplateFile(path.join(this.templatesDir, file));
      }
      // Remove templates from DB that no longer exist on disk
      const dbTemplates = this.getAllTemplates();
      for (const template of dbTemplates) {
        if (!fileIds.has(template.id)) {
          this.deleteDocument(template.id, 'prompt_template');
          console.log(`🗑️  Removed stale template from DB: ${template.id}`);
        }
      }
    } catch (error) {
      console.error('❌ Error syncing templates:', error);
      throw error;
    }
  }

  private async syncPersonaFile(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const persona = JSON.parse(content);
      if (!SyncUtils.validatePersonaStructure(persona)) {
        console.warn(`⚠️  Invalid persona file: ${filePath}`);
        return;
      }
      const fileName = path.basename(filePath, '.json');
      const stats = await fs.stat(filePath);
      this.upsertDocument(
        fileName,
        'persona',
        persona.name || fileName,
        persona,
        filePath,
        stats.mtime
      );
      console.log(`🔄 Synced persona: ${fileName}`);
    } catch (error) {
      console.error(`❌ Error syncing persona file ${filePath}:`, error);
      throw error;
    }
  }

  private async syncTemplateFile(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const parsedFile = SyncUtils.parsePromptyFile(content);
      if (!parsedFile || !SyncUtils.validatePromptStructure(parsedFile)) {
        console.warn(`⚠️  Invalid template file: ${filePath}`);
        return;
      }
      const fileName = path.basename(filePath, '.prompty');
      const stats = await fs.stat(filePath);
      this.upsertDocument(
        fileName,
        'prompt_template',
        parsedFile.name || fileName,
        parsedFile,
        filePath,
        stats.mtime
      );
      console.log(`🔄 Synced template: ${fileName}`);
    } catch (error) {
      console.error(`❌ Error syncing template file ${filePath}:`, error);
      throw error;
    }
  }

  private startFileWatchers(): void {
    // Watch personas directory
    const personaWatcher = chokidar.watch(
      path.join(this.personasDir, '*.json'),
      {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
          stabilityThreshold: 300,
          pollInterval: 100
        },
        usePolling: false,
        alwaysStat: true,
        depth: 0
      }
    );
    personaWatcher
      .on('add', (filePath) => {
        console.log(`📁 New persona file detected: ${filePath}`);
        this.syncPersonaFile(filePath).catch(console.error);
      })
      .on('change', (filePath) => {
        console.log(`📝 Persona file changed: ${filePath}`);
        this.syncPersonaFile(filePath).catch(console.error);
      })
      .on('unlink', (filePath) => {
        console.log(`🗑️  Persona file deleted: ${filePath}`);
        const fileName = path.basename(filePath, '.json');
        this.deleteDocument(fileName, 'persona');
      })
      .on('error', (error) => {
        console.error('❌ Persona watcher error:', error);
      })
      .on('ready', () => {
        console.log('👁️  Persona file watcher ready');
      });
    this.watchers.push(personaWatcher);
    // Watch templates directory
    const templateWatcher = chokidar.watch(
      path.join(this.templatesDir, '*.prompty'),
      {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
          stabilityThreshold: 300,
          pollInterval: 100
        },
        usePolling: false,
        alwaysStat: true,
        depth: 0
      }
    );
    templateWatcher
      .on('add', (filePath) => {
        console.log(`📁 New template file detected: ${filePath}`);
        this.syncTemplateFile(filePath).catch(console.error);
      })
      .on('change', (filePath) => {
        console.log(`📝 Template file changed: ${filePath}`);
        this.syncTemplateFile(filePath).catch(console.error);
      })
      .on('unlink', (filePath) => {
        console.log(`🗑️  Template file deleted: ${filePath}`);
        const fileName = path.basename(filePath, '.prompty');
        this.deleteDocument(fileName, 'prompt_template');
      })
      .on('error', (error) => {
        console.error('❌ Template watcher error:', error);
      })
      .on('ready', () => {
        console.log('👁️  Template file watcher ready');
      });
    this.watchers.push(templateWatcher);
  }

  // Manual sync methods for testing
  async forceSyncPersonas(): Promise<void> {
    console.log('🔄 Force syncing personas...');
    await this.syncPersonas();
  }

  async forceSyncTemplates(): Promise<void> {
    console.log('🔄 Force syncing templates...');
    await this.syncTemplates();
  }

  async forceSyncAll(): Promise<void> {
    console.log('🔄 Force syncing all files...');
    await this.syncAllFiles();
  }
}
