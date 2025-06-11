import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

interface PrompyConfiguration {
  type: string;
  azure_endpoint?: string;
  azure_deployment?: string;
  api_version?: string;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

interface PrompyModel {
  api: string;
  configuration: PrompyConfiguration;
}

interface PrompyMetadata {
  name: string;
  description: string;
  authors: string[];
  model: PrompyModel;
  parameters: Record<string, string>;
}

interface PrompyTemplate {
  metadata: PrompyMetadata;
  content: string;
}

export class PrompyLoader {  private static parseTemplate(filePath: string): PrompyTemplate {
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
        const metadata = yaml.load(frontmatter) as PrompyMetadata;
        return { metadata, content };
      } catch (error) {
        throw new Error(`Failed to parse Prompty frontmatter: ${error}`);
      }
    }
    
    const frontmatter = match[1];
    const content = match[2].trim();
    
    try {
      const metadata = yaml.load(frontmatter) as PrompyMetadata;
      return { metadata, content };
    } catch (error) {
      throw new Error(`Failed to parse Prompty frontmatter: ${error}`);
    }
  }
  
  public static loadTemplate(templateName: string): PrompyTemplate {
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
  
  public static renderTemplate(
    templateName: string,
    parameters: Record<string, any>
  ): { systemMessage: string; configuration: PrompyConfiguration } {
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
      } else {
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
    const resolvedConfig = { ...template.metadata.model.configuration };
    Object.keys(resolvedConfig).forEach(key => {
      const value = resolvedConfig[key as keyof PrompyConfiguration];
      if (typeof value === 'string' && value.startsWith('${env:')) {
        const envVar = value.slice(6, -1); // Remove ${env: and }
        (resolvedConfig as any)[key] = process.env[envVar] || value;
      }
    });
    
    return {
      systemMessage: renderedContent.trim(),
      configuration: resolvedConfig
    };
  }
}

export { PrompyTemplate, PrompyMetadata, PrompyConfiguration };
