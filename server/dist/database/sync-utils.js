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
exports.SyncUtils = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class SyncUtils {
    /**
     * Get information about all persona files in a directory
     */
    static getPersonaFiles(personasDir) {
        if (!fs.existsSync(personasDir)) {
            return [];
        }
        const files = [];
        const personaFiles = fs.readdirSync(personasDir).filter(f => f.endsWith('.json'));
        for (const file of personaFiles) {
            try {
                const filePath = path.join(personasDir, file);
                const stats = fs.statSync(filePath);
                const content = fs.readFileSync(filePath, 'utf-8');
                const persona = JSON.parse(content);
                files.push({
                    id: path.basename(file, '.json'),
                    name: persona.name || path.basename(file, '.json'),
                    filePath,
                    modified: stats.mtime,
                    size: stats.size,
                    type: 'persona'
                });
            }
            catch (error) {
                console.warn(`Failed to read persona file ${file}:`, error);
            }
        }
        return files;
    }
    /**
     * Get information about all prompt template files in a directory
     */
    static getPromptFiles(promptsDir) {
        if (!fs.existsSync(promptsDir)) {
            return [];
        }
        const files = [];
        const promptFiles = fs.readdirSync(promptsDir).filter(f => f.endsWith('.prompty'));
        for (const file of promptFiles) {
            try {
                const filePath = path.join(promptsDir, file);
                const stats = fs.statSync(filePath);
                const content = fs.readFileSync(filePath, 'utf-8');
                const parsed = this.parsePromptyFile(content);
                files.push({
                    id: path.basename(file, '.prompty'),
                    name: parsed.name || path.basename(file, '.prompty'),
                    filePath,
                    modified: stats.mtime,
                    size: stats.size,
                    type: 'prompt_template'
                });
            }
            catch (error) {
                console.warn(`Failed to read prompt file ${file}:`, error);
            }
        }
        return files;
    }
    /**
     * Parse a prompty file into structured data
     */
    static parsePromptyFile(content) {
        try {
            // Split frontmatter and content
            const parts = content.split('---');
            if (parts.length < 3) {
                // No frontmatter, treat entire content as prompt
                return {
                    metadata: {},
                    content: content.trim(),
                    name: 'Unknown Template'
                };
            }
            // Parse YAML frontmatter
            const frontmatter = parts[1].trim();
            const promptContent = parts.slice(2).join('---').trim();
            const metadata = this.parseBasicYaml(frontmatter);
            return {
                metadata,
                content: promptContent,
                name: metadata.name || 'Unknown Template',
                description: metadata.description,
                authors: metadata.authors,
                model: metadata.model,
                parameters: metadata.parameters
            };
        }
        catch (error) {
            console.warn('Failed to parse prompty file:', error);
            return {
                metadata: {},
                content: content,
                name: 'Unknown Template'
            };
        }
    }
    /**
     * Basic YAML parser for frontmatter
     */
    static parseBasicYaml(yamlString) {
        const result = {};
        const lines = yamlString.split('\n');
        let currentKey = '';
        let currentValue = '';
        let inMultiLine = false;
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith('#')) {
                continue; // Skip empty lines and comments
            }
            const colonIndex = line.indexOf(':');
            if (colonIndex > 0 && !inMultiLine) {
                // New key-value pair
                if (currentKey && currentValue !== '') {
                    result[currentKey] = this.parseYamlValue(currentValue.trim());
                }
                currentKey = line.substring(0, colonIndex).trim();
                currentValue = line.substring(colonIndex + 1).trim();
                // Check if this is a multi-line value
                if (currentValue === '|' || currentValue === '>') {
                    inMultiLine = true;
                    currentValue = '';
                }
            }
            else if (inMultiLine) {
                // Continue multi-line value
                if (line.startsWith('  ')) {
                    currentValue += (currentValue ? '\n' : '') + line.substring(2);
                }
                else {
                    // End of multi-line value
                    inMultiLine = false;
                    if (currentKey) {
                        result[currentKey] = currentValue;
                    }
                    currentKey = '';
                    currentValue = '';
                }
            }
        }
        // Handle last key-value pair
        if (currentKey && currentValue !== '') {
            result[currentKey] = this.parseYamlValue(currentValue.trim());
        }
        return result;
    }
    /**
     * Parse individual YAML values
     */
    static parseYamlValue(value) {
        // Remove quotes if present
        let cleanValue = value.replace(/^['"](.*)['"]$/, '$1');
        // Handle arrays (basic)
        if (cleanValue.startsWith('[') && cleanValue.endsWith(']')) {
            return cleanValue.slice(1, -1)
                .split(',')
                .map(v => v.trim().replace(/^['"](.*)['"]$/, '$1'))
                .filter(v => v.length > 0);
        }
        // Handle objects (very basic)
        if (cleanValue.startsWith('{') && cleanValue.endsWith('}')) {
            try {
                return JSON.parse(cleanValue);
            }
            catch (_a) {
                return cleanValue;
            }
        }
        // Handle booleans
        if (cleanValue === 'true')
            return true;
        if (cleanValue === 'false')
            return false;
        // Handle null/undefined
        if (cleanValue === 'null' || cleanValue === '~')
            return null;
        // Handle numbers
        if (!isNaN(Number(cleanValue)) && cleanValue !== '') {
            return Number(cleanValue);
        }
        return cleanValue;
    }
    /**
     * Check if a file has been modified since a given date
     */
    static isFileModifiedSince(filePath, since) {
        try {
            const stats = fs.statSync(filePath);
            return stats.mtime > since;
        }
        catch (error) {
            // File doesn't exist or can't be accessed
            return false;
        }
    }
    /**
     * Get file modification time
     */
    static getFileModificationTime(filePath) {
        try {
            const stats = fs.statSync(filePath);
            return stats.mtime;
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Validate persona JSON structure
     */
    static validatePersonaStructure(persona) {
        if (!persona || typeof persona !== 'object') {
            return false;
        }
        // Check for required fields (basic validation)
        return typeof persona.name === 'string' && persona.name.length > 0;
    }
    /**
     * Validate prompt template structure
     */
    static validatePromptStructure(template) {
        if (!template || typeof template !== 'object') {
            return false;
        }
        // Check for required fields
        return (typeof template.content === 'string' &&
            template.content.length > 0 &&
            (typeof template.name === 'string' && template.name.length > 0));
    }
    /**
     * Generate a safe filename from a document name
     */
    static generateSafeFilename(name, extension) {
        // Remove invalid characters and replace spaces with hyphens
        const safeName = name
            .replace(/[^a-zA-Z0-9\s-_]/g, '')
            .replace(/\s+/g, '-')
            .toLowerCase();
        return `${safeName}.${extension}`;
    }
    /**
     * Calculate file hash for change detection
     */
    static calculateFileHash(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            // Simple hash based on content length and first/last characters
            const hash = content.length +
                (content.charCodeAt(0) || 0) +
                (content.charCodeAt(content.length - 1) || 0);
            return hash.toString(36);
        }
        catch (error) {
            return 'error';
        }
    }
}
exports.SyncUtils = SyncUtils;
