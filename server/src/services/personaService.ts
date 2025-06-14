import * as path from 'path';
import * as fs from 'fs';
import { databaseServiceFactory } from './database-service-factory';

/**
 * Get all personas - uses database if available, falls back to files
 */
export function getAllPersonas(): any[] {
  try {
    // Try database first
    if (databaseServiceFactory.shouldUseDatabase()) {
      const db = databaseServiceFactory.getDatabase();
      if (db) {
        const personas = db.getAllPersonas();
        console.log(`📊 Retrieved ${personas.length} personas from database`);
        return personas;
      }
    }
    
    // Fallback to file system
    console.log('📁 Falling back to file-based persona retrieval');
    return getPersonasFromFiles();
    
  } catch (error) {
    console.error('❌ Error retrieving personas from database, falling back to files:', error);
    return getPersonasFromFiles();
  }
}

/**
 * Get persona by ID - uses database if available, falls back to files
 */
export function getPersonaById(id: string): any | null {
  try {
    // Try database first
    if (databaseServiceFactory.shouldUseDatabase()) {
      const db = databaseServiceFactory.getDatabase();
      if (db) {
        const persona = db.getPersonaById(id);
        if (persona) {
          console.log(`📊 Retrieved persona '${id}' from database`);
          return persona;
        }
      }
    }
    
    // Fallback to file system
    console.log(`📁 Falling back to file-based retrieval for persona '${id}'`);
    return getPersonaFromFile(id);
    
  } catch (error) {
    console.error(`❌ Error retrieving persona '${id}' from database, falling back to files:`, error);
    return getPersonaFromFile(id);
  }
}

/**
 * Search personas by term - database only feature with file fallback
 */
export function searchPersonas(searchTerm: string): any[] {
  try {
    // Try database search (advanced feature)
    if (databaseServiceFactory.shouldUseDatabase()) {
      const db = databaseServiceFactory.getDatabase();
      if (db) {
        const results = db.searchDocuments('persona', searchTerm);
        console.log(`🔍 Search for '${searchTerm}' found ${results.length} personas in database`);
        return results;
      }
    }
    
    // Fallback: simple file-based search
    console.log(`📁 Falling back to file-based search for '${searchTerm}'`);
    const allPersonas = getPersonasFromFiles();
    return allPersonas.filter(persona => 
      JSON.stringify(persona).toLowerCase().includes(searchTerm.toLowerCase())
    );
    
  } catch (error) {
    console.error(`❌ Error searching personas for '${searchTerm}':`, error);
    return [];
  }
}

/**
 * Get personas by age group - database feature with file fallback
 */
export function getPersonasByAgeGroup(ageGroup: string): any[] {
  try {
    // Try database query (if database supports this method)
    if (databaseServiceFactory.shouldUseDatabase()) {
      const db = databaseServiceFactory.getDatabase();
      if (db && 'getPersonasByAgeGroup' in db) {
        const results = (db as any).getPersonasByAgeGroup(ageGroup);
        console.log(`📊 Found ${results.length} personas for age group '${ageGroup}' in database`);
        return results;
      }
    }
    
    // Fallback: filter file-based personas
    console.log(`📁 Falling back to file-based filtering for age group '${ageGroup}'`);
    const allPersonas = getPersonasFromFiles();
    return allPersonas.filter(persona => 
      persona.demographics?.ageGroup?.toLowerCase().includes(ageGroup.toLowerCase())
    );
    
  } catch (error) {
    console.error(`❌ Error retrieving personas for age group '${ageGroup}':`, error);
    return [];
  }
}

// File-based implementation functions (private)
function getPersonasFromFiles(): any[] {
  const personasDir = resolvePersonasDir();
  const files = fs.readdirSync(personasDir).filter(f => f.endsWith('.json'));
  const personas = [];
  
  for (const file of files) {
    try {
      const personaPath = path.join(personasDir, file);
      const persona = JSON.parse(fs.readFileSync(personaPath, 'utf-8'));
      
      // Add ID if not present
      if (!persona.id) {
        persona.id = path.basename(file, '.json');
      }
      
      personas.push(persona);
    } catch (err) {
      console.warn(`Failed to load persona file ${file}:`, err);
    }
  }
  
  return personas;
}

function getPersonaFromFile(id: string): any | null {
  const personasDir = resolvePersonasDir();
  const files = fs.readdirSync(personasDir).filter(f => f.endsWith('.json'));
  const personaFile = files.find(f => f.replace(/\.json$/, '') === id);
  
  if (!personaFile) return null;
  
  try {
    const personaPath = path.join(personasDir, personaFile);
    const persona = JSON.parse(fs.readFileSync(personaPath, 'utf-8'));
    
    // Add ID if not present
    if (!persona.id) {
      persona.id = id;
    }
    
    return persona;
  } catch (err) {
    console.warn(`Failed to load persona file ${personaFile}:`, err);
    return null;
  }
}

function resolvePersonasDir(): string {
  return databaseServiceFactory.resolvePersonasDir();
}
