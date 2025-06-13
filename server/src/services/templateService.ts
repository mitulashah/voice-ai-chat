import * as path from 'path';
import * as fs from 'fs';
import { PrompyLoader } from '../prompts/promptyLoader';

export function getAllTemplates() {
  const promptsDir = path.join(__dirname, '..', 'prompts');
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
        prompt: content
      });
    } catch (error) {
      // Optionally log or handle error
    }
  }
  return templates;
}
