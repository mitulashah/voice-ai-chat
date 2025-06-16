import { PrompyLoader } from './promptyLoader';
import { config } from '../config/env';
import { getScenarioById, formatScenarioForTemplate } from '../services/scenarioService';
import { getPersonaById, formatPersonaForTemplate } from '../services/personaService';

/**
 * Utility class for managing different Prompty templates based on conversation context
 */
export class TemplateManager {
  private static readonly DEFAULT_TEMPLATE = 'chat-agent';
  
  /**
   * Determines which template to use based on conversation context
   */
  public static selectTemplate(messages: any[], userContext?: any): string {
    const lastMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
    const conversationHistory = messages.map(m => m.content?.toLowerCase()).join(' ');
    
    // Learning/tutoring detection
    if (lastMessage.includes('learn about') ||
        lastMessage.includes('teach me') ||
        lastMessage.includes('explain') ||
        lastMessage.includes('how does') ||
        lastMessage.includes('what is') ||
        lastMessage.includes('help me understand') ||
        conversationHistory.includes('lesson') ||
        conversationHistory.includes('study')) {
      return 'learning-tutor';
    }
    
    // Default to training agent
    return process.env.PROMPTY_TEMPLATE || this.DEFAULT_TEMPLATE;
  }
  
  /**
   * Extracts relevant parameters from the conversation context
   */
  public static extractParameters(messages: any[], templateName: string): Record<string, any> {
    const lastMessage = messages[messages.length - 1]?.content || '';
    const conversationContext = messages.slice(-config.messageWindowSize)
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');
    
    const baseParams = {
      conversation_context: conversationContext,
      user_input: lastMessage
    };
    
    if (templateName === 'learning-tutor') {
      // Extract learning context
      const subjectMatch = lastMessage.match(/(?:learn about|teach me|explain) (.+?)(?:\?|$|\.)/i);
      const subject = subjectMatch ? subjectMatch[1] : 'general topic';
      
      return {
        ...baseParams,
        subject: subject,
        learning_level: 'intermediate', // Could be determined from conversation history
        learning_style: 'conversational' // Default for voice-based learning
      };
    }
    
    return baseParams;
  }  /**
   * Gets the appropriate system message and configuration for the current context
   */
  public static async getContextualPrompt(messages: any[], parameters?: Record<string, any>, userContext?: any) {
    // Use template name from parameters if provided, otherwise use default selection logic
    let templateName: string;
    
    if (parameters?.templateName) {
      // Map UI template names to prompty file names
      const templateMapping: Record<string, string> = {
        'Customer Simulation': 'generic-simulation',
        'Chat Agent': 'chat-agent',
        'Training Agent': 'chat-agent', // fallback
      };
      templateName = templateMapping[parameters.templateName] || 'chat-agent';
    } else {
      templateName = this.selectTemplate(messages, userContext);
    }
      // Start with provided parameters or extract from messages
    let templateParameters = parameters ?? this.extractParameters(messages, templateName);
      // If persona is provided, fetch persona details from files/database
    if (templateParameters.persona) {
      try {
        console.log('TemplateManager: Looking up persona:', templateParameters.persona);
        const persona = await getPersonaById(templateParameters.persona);
        if (persona) {          console.log('TemplateManager: Found persona details for:', templateParameters.persona, persona);
          // Replace the persona ID with detailed persona information
          const personaFormatted = formatPersonaForTemplate(persona);
          templateParameters = {
            ...templateParameters,
            ...personaFormatted,
          };
          // Don't delete the persona parameter since formatPersonaForTemplate sets it to the rich description
          console.log('TemplateManager: Updated parameters with persona details:', templateParameters);
        } else {
          console.warn('TemplateManager: Persona not found:', templateParameters.persona);
          // Keep the original persona value as fallback
        }
      } catch (error) {
        console.warn('TemplateManager: Failed to fetch persona details:', error);
        // Keep the original persona value as fallback
      }
    }
      // If scenarioId is provided, fetch scenario details from database
    if (templateParameters.scenarioId) {
      try {
        console.log('TemplateManager: Looking up scenario:', templateParameters.scenarioId);
        const scenario = await getScenarioById(templateParameters.scenarioId);
        if (scenario) {
          console.log('TemplateManager: Found scenario details for:', templateParameters.scenarioId, scenario);
          // Replace simple scenario details with comprehensive scenario information
          const scenarioFormatted = formatScenarioForTemplate(scenario);
          templateParameters = {
            ...templateParameters,
            ...scenarioFormatted,
          };
          // Don't delete scenarioId since formatScenarioForTemplate doesn't set it
          console.log('TemplateManager: Updated parameters with scenario details:', templateParameters);
        } else {
          console.warn('TemplateManager: Scenario not found:', templateParameters.scenarioId);
          // Continue with default values
          templateParameters.scenario_details = 'General inquiry';
          templateParameters.exit_criteria = 'Issue resolved and customer satisfied';
        }
      } catch (error) {
        console.warn('TemplateManager: Failed to fetch scenario details:', error);
        // Continue with default values
        templateParameters.scenario_details = 'General inquiry';
        templateParameters.exit_criteria = 'Issue resolved and customer satisfied';
      }
    }
    
    // Remove templateName and scenarioId from parameters to avoid substitution
    if (templateParameters.templateName) {
      delete templateParameters.templateName;
    }
    if (templateParameters.scenarioId) {
      delete templateParameters.scenarioId;
    }
    
    try {
      return PrompyLoader.renderTemplate(templateName, templateParameters);
    } catch (error) {
      console.warn(`Failed to load template ${templateName}, falling back to default:`, error);
      // Fallback to default template
      return PrompyLoader.renderTemplate(this.DEFAULT_TEMPLATE, templateParameters);
    }
  }
}
