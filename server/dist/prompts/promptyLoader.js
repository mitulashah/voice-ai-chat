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
exports.PrompyLoader = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const yaml = __importStar(require("js-yaml"));
class PrompyLoader {
    static parseTemplate(filePath) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        // Split frontmatter and content - more robust parsing
        const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
        const match = fileContent.match(frontmatterRegex);
        if (!match) {
            // Fallback to original parsing method
            const parts = fileContent.split('---');
            if (parts.length < 3) {
                throw new Error('Invalid Prompty file format: missing frontmatter');
            }
            const frontmatter = parts[1];
            const content = parts.slice(2).join('---').trim();
            try {
                const metadata = yaml.load(frontmatter);
                return { metadata, content };
            }
            catch (error) {
                throw new Error(`Failed to parse Prompty frontmatter: ${error}`);
            }
        }
        const frontmatter = match[1];
        const content = match[2].trim();
        try {
            const metadata = yaml.load(frontmatter);
            return { metadata, content };
        }
        catch (error) {
            throw new Error(`Failed to parse Prompty frontmatter: ${error}`);
        }
    }
    static loadTemplate(templateName) {
        // Try loading from dist/prompts first
        let filePath = path.join(__dirname, '..', 'prompts', `${templateName}.prompty`);
        // Fallback to source folder when running compiled code
        if (!fs.existsSync(filePath)) {
            filePath = path.join(process.cwd(), 'src', 'prompts', `${templateName}.prompty`);
        }
        if (!fs.existsSync(filePath)) {
            throw new Error(`Prompty template not found: ${filePath}`);
        }
        return this.parseTemplate(filePath);
    }
    static renderTemplate(templateName, parameters) {
        const template = this.loadTemplate(templateName);
        // Simple template rendering (replace {{variable}} with values)
        let renderedContent = template.content;
        // Handle conditional blocks {% if variable %}...{% endif %}
        Object.keys(parameters).forEach(key => {
            const value = parameters[key];
            // Replace {% if key %} blocks
            const ifPattern = new RegExp(`{% if ${key} %}([\\s\\S]*?){% endif %}`, 'g');
            if (value) {
                renderedContent = renderedContent.replace(ifPattern, '$1');
            }
            else {
                renderedContent = renderedContent.replace(ifPattern, '');
            }
            // Replace {{key}} placeholders
            const placeholder = new RegExp(`{{${key}}}`, 'g');
            renderedContent = renderedContent.replace(placeholder, String(value || ''));
        });
        // Clean up any remaining template syntax
        renderedContent = renderedContent.replace(/{% if \w+ %}|{% endif %}/g, '');
        renderedContent = renderedContent.replace(/{{[\w_]+}}/g, '');
        // Resolve environment variables in configuration
        const resolvedConfig = Object.assign({}, template.metadata.model.configuration);
        Object.keys(resolvedConfig).forEach(key => {
            const value = resolvedConfig[key];
            if (typeof value === 'string' && value.startsWith('${env:')) {
                const envVar = value.slice(6, -1); // Remove ${env: and }
                resolvedConfig[key] = process.env[envVar] || value;
            }
        });
        return {
            systemMessage: renderedContent.trim(),
            configuration: resolvedConfig
        };
    }
}
exports.PrompyLoader = PrompyLoader;
