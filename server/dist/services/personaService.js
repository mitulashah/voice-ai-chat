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
exports.formatPersonaForTemplate = formatPersonaForTemplate;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const database_service_factory_1 = require("./database-service-factory");
/**
 * Get all personas - uses database if available, falls back to files
 */
function getAllPersonas(dbInstance) {
    try {
        const db = dbInstance !== null && dbInstance !== void 0 ? dbInstance : (database_service_factory_1.databaseServiceFactory.shouldUseDatabase() ? database_service_factory_1.databaseServiceFactory.getDatabase() : null);
        if (db) {
            const personas = db.getAllPersonas();
            return personas.map((persona) => (Object.assign({}, persona)));
        }
        return getPersonasFromFiles();
    }
    catch (error) {
        return getPersonasFromFiles();
    }
}
/**
 * Get persona by ID - uses database if available, falls back to files
 */
function getPersonaById(id, dbInstance) {
    try {
        const db = dbInstance !== null && dbInstance !== void 0 ? dbInstance : (database_service_factory_1.databaseServiceFactory.shouldUseDatabase() ? database_service_factory_1.databaseServiceFactory.getDatabase() : null);
        if (db) {
            const persona = db.getPersonaById(id);
            if (persona) {
                return Object.assign({}, persona);
            }
        }
        return getPersonaFromFile(id);
    }
    catch (error) {
        return getPersonaFromFile(id);
    }
}
/**
 * Search personas by term - database only feature with file fallback
 */
function searchPersonas(searchTerm, dbInstance) {
    try {
        const db = dbInstance !== null && dbInstance !== void 0 ? dbInstance : (database_service_factory_1.databaseServiceFactory.shouldUseDatabase() ? database_service_factory_1.databaseServiceFactory.getDatabase() : null);
        if (db) {
            const results = db.searchDocuments('persona', searchTerm);
            return results.map((persona) => (Object.assign({}, persona)));
        }
        const allPersonas = getPersonasFromFiles();
        return allPersonas.filter((persona) => JSON.stringify(persona).toLowerCase().includes(searchTerm.toLowerCase()));
    }
    catch (error) {
        return [];
    }
}
/**
 * Get personas by age group - database feature with file fallback
 */
function getPersonasByAgeGroup(ageGroup, dbInstance) {
    try {
        const db = dbInstance !== null && dbInstance !== void 0 ? dbInstance : (database_service_factory_1.databaseServiceFactory.shouldUseDatabase() ? database_service_factory_1.databaseServiceFactory.getDatabase() : null);
        if (db && 'getPersonasByAgeGroup' in db) {
            const results = db.getPersonasByAgeGroup(ageGroup);
            return results.map((persona) => (Object.assign({}, persona)));
        }
        const allPersonas = getPersonasFromFiles();
        return allPersonas.filter((persona) => { var _a, _b; return (_b = (_a = persona.demographics) === null || _a === void 0 ? void 0 : _a.ageGroup) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(ageGroup.toLowerCase()); });
    }
    catch (error) {
        return [];
    }
}
/**
 * Format persona details for template substitution
 */
function formatPersonaForTemplate(persona) {
    if (!persona)
        return {};
    console.log('PersonaService: Formatting persona for template:', persona);
    const formatted = {
        persona_name: persona.name || '',
        persona_id: persona.id || '',
    };
    // Add demographics as separate fields
    if (persona.demographics) {
        Object.entries(persona.demographics).forEach(([key, value]) => {
            formatted[`persona_${key}`] = String(value || '');
        });
    }
    // Add main persona characteristics
    formatted.persona_behavior = persona.behavior || '';
    formatted.persona_needs = persona.needs || '';
    formatted.persona_painpoints = persona.painpoints || '';
    // Also provide a combined persona description for templates that expect it
    const parts = [];
    if (persona.name)
        parts.push(`Name: ${persona.name}`);
    if (persona.demographics) {
        const demo = Object.entries(persona.demographics)
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ');
        if (demo)
            parts.push(`Demographics: ${demo}`);
    }
    if (persona.behavior)
        parts.push(`Behavior: ${persona.behavior}`);
    if (persona.needs)
        parts.push(`Needs: ${persona.needs}`);
    if (persona.painpoints)
        parts.push(`Pain Points: ${persona.painpoints}`);
    formatted.persona = parts.join('\n');
    console.log('PersonaService: Formatted persona parameters:', formatted);
    return formatted;
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
