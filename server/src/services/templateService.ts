import * as path from 'path';
import * as fs from 'fs';
import { PrompyLoader } from '../prompts/promptyLoader';
import { databaseServiceFactory } from './database-service-factory';

/**
 * Get all templates - uses database if available, falls back to files
 */
export function getAllTemplates(): any[] {
  try {
    // Try database first
    if (databaseServiceFactory.shouldUseDatabase()) {
      const db = databaseServiceFactory.getDatabase();
      if (db) {
        const templates = db.getAllTemplates();
        console.log(`📊 Retrieved ${templates.length} templates from database`);
        
        // Convert to expected format for API compatibility
        return templates.map(template => ({
          id: template.id || template.name,
          name: template.metadata?.name || template.name,
          description: template.metadata?.description || template.description,
          prompt: template.content,
          metadata: template.metadata,
          // Include raw template data for advanced features
          ...template
        }));
      }
    }
    
    // Fallback to file system
    console.log('📁 Falling back to file-based template retrieval');
    return getTemplatesFromFiles();
    
  } catch (error) {
    console.error('❌ Error retrieving templates from database, falling back to files:', error);
    return getTemplatesFromFiles();
  }
}

/**
 * Get template by ID - uses database if available, falls back to files
 */
export function getTemplateById(id: string): any | null {
  try {
    // Try database first
    if (databaseServiceFactory.shouldUseDatabase()) {
      const db = databaseServiceFactory.getDatabase();
      if (db) {
        const template = db.getTemplateById(id);
        if (template) {
          console.log(`📊 Retrieved template '${id}' from database`);
          
          // Convert to expected format for API compatibility
          return {
            id: template.id || id,
            name: template.metadata?.name || template.name,
            description: template.metadata?.description || template.description,
            prompt: template.content,
            metadata: template.metadata,
            // Include raw template data for advanced features
            ...template
          };
        }
      }
    }
    
    // Fallback to file system
    console.log(`📁 Falling back to file-based retrieval for template '${id}'`);
    return getTemplateFromFile(id);
    
  } catch (error) {
    console.error(`❌ Error retrieving template '${id}' from database, falling back to files:`, error);
    return getTemplateFromFile(id);
  }
}

/**
 * Search templates by term - database only feature with file fallback
 */
export function searchTemplates(searchTerm: string): any[] {
  try {
    // Try database search (advanced feature)
    if (databaseServiceFactory.shouldUseDatabase()) {
      const db = databaseServiceFactory.getDatabase();
      if (db) {
        const results = db.searchDocuments('prompt_template', searchTerm);
        console.log(`🔍 Search for '${searchTerm}' found ${results.length} templates in database`);
        
        // Convert to expected format
        return results.map(template => ({
          id: template.id || template.name,
          name: template.metadata?.name || template.name,
          description: template.metadata?.description || template.description,
          prompt: template.content,
          metadata: template.metadata,
          ...template
        }));
      }
    }
    
    // Fallback: simple file-based search
    console.log(`📁 Falling back to file-based search for '${searchTerm}'`);
    const allTemplates = getTemplatesFromFiles();
    return allTemplates.filter(template => 
      JSON.stringify(template).toLowerCase().includes(searchTerm.toLowerCase())
    );
    
  } catch (error) {
    console.error(`❌ Error searching templates for '${searchTerm}':`, error);
    return [];
  }
}

/**
 * Get templates by model type - database feature with file fallback
 */
export function getTemplatesByModel(modelType: string): any[] {
  try {
    // Try database query
    if (databaseServiceFactory.shouldUseDatabase()) {
      const db = databaseServiceFactory.getDatabase();
      if (db) {
        const allTemplates = db.getAllTemplates();
        const results = allTemplates.filter(template => 
          template.metadata?.model?.api?.toLowerCase().includes(modelType.toLowerCase()) ||
          template.model?.api?.toLowerCase().includes(modelType.toLowerCase())
        );
        
        console.log(`📊 Found ${results.length} templates for model type '${modelType}' in database`);
        
        return results.map(template => ({
          id: template.id || template.name,
          name: template.metadata?.name || template.name,
          description: template.metadata?.description || template.description,
          prompt: template.content,
          metadata: template.metadata,
          ...template
        }));
      }
    }
    
    // Fallback: filter file-based templates
    console.log(`📁 Falling back to file-based filtering for model type '${modelType}'`);
    const allTemplates = getTemplatesFromFiles();
    return allTemplates.filter(template => 
      template.metadata?.model?.api?.toLowerCase().includes(modelType.toLowerCase())
    );
    
  } catch (error) {
    console.error(`❌ Error retrieving templates for model type '${modelType}':`, error);
    return [];
  }
}

// File-based implementation functions (private)
function getTemplatesFromFiles(): any[] {
  const promptsDir = resolvePromptsDir();
  const files = fs.readdirSync(promptsDir).filter(file => file.endsWith('.prompty'));
  const templates: any[] = [];
  
  for (const file of files) {
    const templateName = path.basename(file, '.prompty');
    try {
      const { metadata, content } = PrompyLoader.loadTemplate(templateName);
      templates.push({
        id: templateName,
        name: metadata.name,
        description: metadata.description,
        prompt: content,
        content,
        metadata
      });
    } catch (error) {
      console.warn(`Failed to load template file ${file}:`, error);
    }
  }
  
  return templates;
}

function getTemplateFromFile(id: string): any | null {
  try {
    const { metadata, content } = PrompyLoader.loadTemplate(id);
    return {
      id,
      name: metadata.name,
      description: metadata.description,
      prompt: content,
      content,
      metadata
    };
  } catch (error) {
    console.warn(`Failed to load template '${id}':`, error);
    return null;
  }
}

function resolvePromptsDir(): string {
  return databaseServiceFactory.resolvePromptsDir();
}
