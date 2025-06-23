import { DocumentDatabase } from './document-database';
import * as fs from 'fs';
import * as path from 'path';

interface MigrationResult {
  success: boolean;
  personasCount: number;
  templatesCount: number;
  errors: string[];
}

export class DatabaseMigration {
  private db: DocumentDatabase;
  private personasDir: string;
  private promptsDir: string;

  private constructor(db: DocumentDatabase) {
    this.db = db;
    this.personasDir = path.join(__dirname, '..', 'personas');
    this.promptsDir = path.join(__dirname, '..', 'prompts');
  }

  static async create(dbPath?: string): Promise<DatabaseMigration> {
    const db = await DocumentDatabase.create(dbPath);
    return new DatabaseMigration(db);
  }

  async migrateFromFiles(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      personasCount: 0,
      templatesCount: 0,
      errors: []
    };

    console.log('Starting migration from files to database...');

    // Wait for database to be ready
    let retries = 0;
    while (!this.db.isReady() && retries < 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      retries++;
    }

    if (!this.db.isReady()) {
      result.errors.push('Database failed to initialize within timeout');
      return result;
    }

    try {
      // Migrate personas
      if (fs.existsSync(this.personasDir)) {
        const personaFiles = fs.readdirSync(this.personasDir)
          .filter(f => f.endsWith('.json'));
        
        console.log(`Found ${personaFiles.length} persona files to migrate`);
        
        for (const file of personaFiles) {
          try {
            const id = path.basename(file, '.json');
            const filePath = path.join(this.personasDir, file);
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const document = JSON.parse(fileContent);
            const stats = fs.statSync(filePath);
            
            this.db.upsertDocument(
              id,
              'persona',
              document.name || id,
              document,
              filePath,
              stats.mtime
            );
            
            result.personasCount++;
            console.log(`✅ Migrated persona: ${id}`);
          } catch (error) {
            const errorMsg = `Failed to migrate persona ${file}: ${error}`;
            result.errors.push(errorMsg);
            console.error(`❌ ${errorMsg}`);
          }
        }
      } else {
        console.log('Personas directory not found, skipping persona migration');
      }

      // Migrate prompt templates
      if (fs.existsSync(this.promptsDir)) {
        const promptFiles = fs.readdirSync(this.promptsDir)
          .filter(f => f.endsWith('.prompty'));
        
        console.log(`Found ${promptFiles.length} prompt template files to migrate`);
        
        for (const file of promptFiles) {
          try {
            const id = path.basename(file, '.prompty');
            const filePath = path.join(this.promptsDir, file);
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const stats = fs.statSync(filePath);
            
            // Parse prompty file (basic YAML frontmatter parsing)
            const document = this.parsePromptyFile(fileContent);
            
            // Use the name from frontmatter if available, else fallback to id
            const templateName = document.name || document.metadata?.name || id;
            this.db.upsertDocument(
              id,
              'prompt_template',
              templateName,
              document,
              filePath,
              stats.mtime
            );
            
            result.templatesCount++;
            console.log(`✅ Migrated template: ${id}`);
          } catch (error) {
            const errorMsg = `Failed to migrate template ${file}: ${error}`;
            result.errors.push(errorMsg);
            console.error(`❌ ${errorMsg}`);
          }
        }
      } else {
        console.log('Prompts directory not found, skipping template migration');
      }

      // Check final results
      const stats = this.db.getDocumentStats();
      console.log('\nMigration completed!');
      console.log(`- Personas migrated: ${result.personasCount}`);
      console.log(`- Templates migrated: ${result.templatesCount}`);
      console.log(`- Total in database: ${stats.total}`);
      console.log(`- Errors: ${result.errors.length}`);

      result.success = result.errors.length === 0;

      if (result.errors.length > 0) {
        console.log('\nErrors encountered:');
        result.errors.forEach(error => console.log(`- ${error}`));
      }

    } catch (error) {
      result.errors.push(`Migration failed: ${error}`);
      console.error('Migration failed:', error);
    }

    return result;
  }

  private parsePromptyFile(content: string): any {
    try {
      // Split frontmatter and content
      const parts = content.split('---');
      
      if (parts.length < 3) {
        // No frontmatter, treat entire content as prompt
        return {
          metadata: {},
          content: content.trim()
        };
      }

      // Parse YAML frontmatter (basic parsing)
      const frontmatter = parts[1].trim();
      const promptContent = parts.slice(2).join('---').trim();
      
      const metadata: any = {};
      
      // Basic YAML parsing for common fields
      const lines = frontmatter.split('\n');
      for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim();
          const value = line.substring(colonIndex + 1).trim();
          
          // Remove quotes if present
          const cleanValue = value.replace(/^['"](.*)['"]$/, '$1');
          
          // Handle arrays (basic)
          if (cleanValue.startsWith('[') && cleanValue.endsWith(']')) {
            metadata[key] = cleanValue.slice(1, -1).split(',').map(v => v.trim().replace(/^['"](.*)['"]$/, '$1'));
          } else {
            metadata[key] = cleanValue;
          }
        }
      }

      return {
        metadata,
        content: promptContent,
        // Flatten for easier access
        name: metadata.name,
        description: metadata.description,
        authors: metadata.authors,
        model: metadata.model,
        parameters: metadata.parameters
      };
    } catch (error) {
      console.warn('Failed to parse prompty file, using content as-is:', error);
      return {
        metadata: {},
        content: content,
        name: 'Unknown Template'
      };
    }
  }

  close(): void {
    this.db.close();
  }
}

// Migration script
async function runMigration(): Promise<void> {
  console.log('🚀 Starting database migration...\n');
  
  const migration = await DatabaseMigration.create();
  
  try {
    const result = await migration.migrateFromFiles();
    
    if (result.success) {
      console.log('\n🎉 Migration completed successfully!');
    } else {
      console.log('\n⚠️  Migration completed with errors.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  } finally {
    migration.close();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  runMigration().catch(console.error);
}
