import { PrompyLoader } from './promptyLoader';
import { config } from '../config/env';

/**
 * Utility class for managing different Prompty templates based on conversation context
 */
export class TemplateManager {
  private static readonly DEFAULT_TEMPLATE = 'training-agent';
  
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
  }
  
  /**
   * Gets the appropriate system message and configuration for the current context
   */
  public static getContextualPrompt(messages: any[], userContext?: any) {
    const templateName = this.selectTemplate(messages, userContext);
    const parameters = this.extractParameters(messages, templateName);
    
    try {
      return PrompyLoader.renderTemplate(templateName, parameters);
    } catch (error) {
      console.warn(`Failed to load template ${templateName}, falling back to default:`, error);
      // Fallback to default template
      return PrompyLoader.renderTemplate(this.DEFAULT_TEMPLATE, parameters);
    }
  }
}
