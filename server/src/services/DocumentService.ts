import { DocumentDatabase } from '../database/document-database';
import type { Persona, Template, Scenario } from '../types/api';

/**
 * Unified business logic service that wraps DocumentDatabase operations.
 * Provides a clean abstraction layer for CRUD operations on all document types.
 * Future-proofed for easy database migration via dependency injection.
 */
export class DocumentService {
  constructor(private db: DocumentDatabase) {}

  // === PERSONA OPERATIONS ===

  async createPersona(personaData: Omit<Persona, 'id'>): Promise<Persona> {
    const persona = {
      id: this.generateId(personaData.name),
      ...personaData
    };
    
    this.validatePersona(persona);
    
    this.db.upsertDocument(
      persona.id,
      'persona',
      persona.name,
      persona,
      '', // filePath not used in pure database mode
      new Date()
    );
    
    return persona;
  }

  async getPersona(id: string): Promise<Persona | null> {
    return this.db.getPersonaById(id) as Persona | null;
  }

  async updatePersona(id: string, updates: Partial<Persona>): Promise<Persona> {
    const existing = await this.getPersona(id);
    if (!existing) {
      throw new Error(`Persona with id '${id}' not found`);
    }

    const updated = { ...existing, ...updates, id }; // Ensure ID doesn't change
    this.validatePersona(updated);
    
    this.db.upsertDocument(
      id,
      'persona',
      updated.name,
      updated,
      '',
      new Date()
    );
    
    return updated;
  }

  async deletePersona(id: string): Promise<void> {
    const existing = await this.getPersona(id);
    if (!existing) {
      throw new Error(`Persona with id '${id}' not found`);
    }
    
    this.db.deleteDocument(id, 'persona');
  }

  async listPersonas(): Promise<Persona[]> {
    return this.db.getAllPersonas();
  }

  async searchPersonas(query: string): Promise<Persona[]> {
    return this.db.searchDocuments('persona', query);
  }

  // === TEMPLATE OPERATIONS ===

  async createTemplate(templateData: Omit<Template, 'id'>): Promise<Template> {
    const template = {
      id: this.generateId(templateData.name),
      ...templateData
    };
    
    this.validateTemplate(template);
    
    this.db.upsertDocument(
      template.id,
      'prompt_template',
      template.name,
      template,
      '',
      new Date()
    );
    
    return template;
  }

  async getTemplate(id: string): Promise<Template | null> {
    return this.db.getTemplateById(id) as Template | null;
  }

  async updateTemplate(id: string, updates: Partial<Template>): Promise<Template> {
    const existing = await this.getTemplate(id);
    if (!existing) {
      throw new Error(`Template with id '${id}' not found`);
    }

    const updated = { ...existing, ...updates, id }; // Ensure ID doesn't change
    this.validateTemplate(updated);
    
    this.db.upsertDocument(
      id,
      'prompt_template',
      updated.name,
      updated,
      '',
      new Date()
    );
    
    return updated;
  }

  async deleteTemplate(id: string): Promise<void> {
    const existing = await this.getTemplate(id);
    if (!existing) {
      throw new Error(`Template with id '${id}' not found`);
    }
    
    this.db.deleteDocument(id, 'prompt_template');
  }

  async listTemplates(): Promise<Template[]> {
    return this.db.getAllTemplates();
  }
  async searchTemplates(query: string): Promise<Template[]> {
    return this.db.searchDocuments('prompt_template', query);
  }

  // === SCENARIO OPERATIONS ===

  async createScenario(scenarioData: Omit<Scenario, 'id'>): Promise<Scenario> {
    const title = (scenarioData as any).title || 'scenario';
    const id = this.generateId(title);
    const scenario = {
      id,
      ...scenarioData
    } as Scenario;
    
    this.validateScenario(scenario);
    
    this.db.upsertDocument(
      scenario.id,
      'scenario',
      scenario.title,
      scenario,
      '',
      new Date()
    );
    
    return scenario;
  }

  async getScenario(id: string): Promise<Scenario | null> {
    return this.db.getScenarioById(id) as Scenario | null;
  }

  async updateScenario(id: string, updates: Partial<Scenario>): Promise<Scenario> {
    const existing = await this.getScenario(id);
    if (!existing) {
      throw new Error(`Scenario with id '${id}' not found`);
    }

    const updated = { ...existing, ...updates, id }; // Ensure ID doesn't change
    this.validateScenario(updated);
    
    this.db.upsertDocument(
      id,
      'scenario',
      updated.title,
      updated,
      '',
      new Date()
    );
    
    return updated;
  }

  async deleteScenario(id: string): Promise<void> {
    const existing = await this.getScenario(id);
    if (!existing) {
      throw new Error(`Scenario with id '${id}' not found`);
    }
    
    this.db.deleteDocument(id, 'scenario');
  }

  async listScenarios(): Promise<Scenario[]> {
    return this.db.getAllScenarios();
  }

  // === MOOD OPERATIONS ===
  // Note: Moods are stored differently and don't support full CRUD in current schema

  async listMoods(): Promise<{ mood: string; description: string }[]> {
    // For now, moods are read-only since they're stored in a separate table
    // This will need to be enhanced when adding mood CRUD support
    throw new Error('Mood operations require database schema updates - use existing mood endpoints for now');
  }

  // === VALIDATION METHODS ===

  private validatePersona(persona: Persona): void {
    if (!persona.name || persona.name.trim().length === 0) {
      throw new Error('Persona name is required');
    }
    if (!persona.id || persona.id.trim().length === 0) {
      throw new Error('Persona ID is required');
    }
    // Add more validation as needed
  }

  private validateTemplate(template: Template): void {
    if (!template.name || template.name.trim().length === 0) {
      throw new Error('Template name is required');
    }
    if (!template.id || template.id.trim().length === 0) {
      throw new Error('Template ID is required');
    }
    if (!template.prompt || template.prompt.trim().length === 0) {
      throw new Error('Template prompt is required');
    }
    // Add more validation as needed
  }

  private validateScenario(scenario: Scenario): void {
    if (!scenario.id || scenario.id.trim().length === 0) {
      throw new Error('Scenario ID is required');
    }
    if (!scenario.title || scenario.title.trim().length === 0) {
      throw new Error('Scenario title is required');
    }
    // Add more validation as needed
  }

  // === UTILITY METHODS ===

  private generateId(name: string): string {
    // Generate a URL-friendly ID from the name
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50) + '_' + Date.now().toString(36);
  }

  // === DATABASE MANAGEMENT ===

  isReady(): boolean {
    return this.db.isReady();
  }

  getStats(): any {
    return this.db.getDocumentStats();
  }

  close(): void {
    this.db.close();
  }
}
