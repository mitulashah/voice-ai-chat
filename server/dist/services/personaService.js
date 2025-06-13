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
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
function resolvePersonasDir() {
    // Prefer dist/personas if it exists (production), else src/personas (dev)
    const distPath = path.join(__dirname, '..', 'personas');
    if (fs.existsSync(distPath))
        return distPath;
    const srcPath = path.join(__dirname, '..', 'src', 'personas');
    if (fs.existsSync(srcPath))
        return srcPath;
    throw new Error('Personas directory not found');
}
function getAllPersonas() {
    const personasDir = resolvePersonasDir();
    const files = fs.readdirSync(personasDir).filter(f => f.endsWith('.json'));
    const personas = [];
    for (const file of files) {
        try {
            const personaPath = path.join(personasDir, file);
            const persona = JSON.parse(fs.readFileSync(personaPath, 'utf-8'));
            personas.push(persona);
        }
        catch (err) {
            // Optionally log or handle error
        }
    }
    return personas;
}
function getPersonaById(id) {
    const personasDir = resolvePersonasDir();
    const files = fs.readdirSync(personasDir).filter(f => f.endsWith('.json'));
    const personaFile = files.find(f => f.replace(/\.json$/, '') === id);
    if (!personaFile)
        return null;
    const personaPath = path.join(personasDir, personaFile);
    return JSON.parse(fs.readFileSync(personaPath, 'utf-8'));
}
