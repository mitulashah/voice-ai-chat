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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllPersonas = getAllPersonas;
exports.getPersonaById = getPersonaById;
exports.searchPersonas = searchPersonas;
exports.getPersonasByAgeGroup = getPersonasByAgeGroup;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const database_service_factory_1 = require("./database-service-factory");
/**
 * Get all personas - uses database if available, falls back to files
 */
function getAllPersonas() {
    try {
        // Try database first
        if (database_service_factory_1.databaseServiceFactory.shouldUseDatabase()) {
            const db = database_service_factory_1.databaseServiceFactory.getDatabase();
            if (db) {
                const personas = db.getAllPersonas();
                console.log(`📊 Retrieved ${personas.length} personas from database`);
                return personas;
            }
        }
        // Fallback to file system
        console.log('📁 Falling back to file-based persona retrieval');
        return getPersonasFromFiles();
    }
    catch (error) {
        console.error('❌ Error retrieving personas from database, falling back to files:', error);
        return getPersonasFromFiles();
    }
}
/**
 * Get persona by ID - uses database if available, falls back to files
 */
function getPersonaById(id) {
    try {
        // Try database first
        if (database_service_factory_1.databaseServiceFactory.shouldUseDatabase()) {
            const db = database_service_factory_1.databaseServiceFactory.getDatabase();
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
    }
    catch (error) {
        console.error(`❌ Error retrieving persona '${id}' from database, falling back to files:`, error);
        return getPersonaFromFile(id);
    }
}
/**
 * Search personas by term - database only feature with file fallback
 */
function searchPersonas(searchTerm) {
    try {
        // Try database search (advanced feature)
        if (database_service_factory_1.databaseServiceFactory.shouldUseDatabase()) {
            const db = database_service_factory_1.databaseServiceFactory.getDatabase();
            if (db) {
                const results = db.searchDocuments('persona', searchTerm);
                console.log(`🔍 Search for '${searchTerm}' found ${results.length} personas in database`);
                return results;
            }
        }
        // Fallback: simple file-based search
        console.log(`📁 Falling back to file-based search for '${searchTerm}'`);
        const allPersonas = getPersonasFromFiles();
        return allPersonas.filter(persona => JSON.stringify(persona).toLowerCase().includes(searchTerm.toLowerCase()));
    }
    catch (error) {
        console.error(`❌ Error searching personas for '${searchTerm}':`, error);
        return [];
    }
}
/**
 * Get personas by age group - database feature with file fallback
 */
function getPersonasByAgeGroup(ageGroup) {
    try {
        // Try database query (if database supports this method)
        if (database_service_factory_1.databaseServiceFactory.shouldUseDatabase()) {
            const db = database_service_factory_1.databaseServiceFactory.getDatabase();
            if (db && 'getPersonasByAgeGroup' in db) {
                const results = db.getPersonasByAgeGroup(ageGroup);
                console.log(`📊 Found ${results.length} personas for age group '${ageGroup}' in database`);
                return results;
            }
        }
        // Fallback: filter file-based personas
        console.log(`📁 Falling back to file-based filtering for age group '${ageGroup}'`);
        const allPersonas = getPersonasFromFiles();
        return allPersonas.filter(persona => { var _a, _b; return (_b = (_a = persona.demographics) === null || _a === void 0 ? void 0 : _a.ageGroup) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(ageGroup.toLowerCase()); });
    }
    catch (error) {
        console.error(`❌ Error retrieving personas for age group '${ageGroup}':`, error);
        return [];
    }
}
// File-based implementation functions (private)
function getPersonasFromFiles() {
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
        }
        catch (err) {
            console.warn(`Failed to load persona file ${file}:`, err);
        }
    }
    return personas;
}
function getPersonaFromFile(id) {
    const personasDir = resolvePersonasDir();
    const files = fs.readdirSync(personasDir).filter(f => f.endsWith('.json'));
    const personaFile = files.find(f => f.replace(/\.json$/, '') === id);
    if (!personaFile)
        return null;
    try {
        const personaPath = path.join(personasDir, personaFile);
        const persona = JSON.parse(fs.readFileSync(personaPath, 'utf-8'));
        // Add ID if not present
        if (!persona.id) {
            persona.id = id;
        }
        return persona;
    }
    catch (err) {
        console.warn(`Failed to load persona file ${personaFile}:`, err);
        return null;
    }
}
function resolvePersonasDir() {
    return database_service_factory_1.databaseServiceFactory.resolvePersonasDir();
}
