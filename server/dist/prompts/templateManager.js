"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateManager = void 0;
const promptyLoader_1 = require("./promptyLoader");
/**
 * Utility class for managing different Prompty templates based on conversation context
 */
class TemplateManager {
    /**
     * Determines which template to use based on conversation context
     */
    static selectTemplate(messages, userContext) {
        var _a, _b;
        const lastMessage = ((_b = (_a = messages[messages.length - 1]) === null || _a === void 0 ? void 0 : _a.content) === null || _b === void 0 ? void 0 : _b.toLowerCase()) || '';
        const conversationHistory = messages.map(m => { var _a; return (_a = m.content) === null || _a === void 0 ? void 0 : _a.toLowerCase(); }).join(' ');
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
    static extractParameters(messages, templateName) {
        var _a;
        const lastMessage = ((_a = messages[messages.length - 1]) === null || _a === void 0 ? void 0 : _a.content) || '';
        const conversationContext = messages.slice(-3)
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
            return Object.assign(Object.assign({}, baseParams), { subject: subject, learning_level: 'intermediate', learning_style: 'conversational' // Default for voice-based learning
             });
        }
        return baseParams;
    }
    /**
     * Gets the appropriate system message and configuration for the current context
     */
    static getContextualPrompt(messages, userContext) {
        const templateName = this.selectTemplate(messages, userContext);
        const parameters = this.extractParameters(messages, templateName);
        try {
            return promptyLoader_1.PrompyLoader.renderTemplate(templateName, parameters);
        }
        catch (error) {
            console.warn(`Failed to load template ${templateName}, falling back to default:`, error);
            // Fallback to default template
            return promptyLoader_1.PrompyLoader.renderTemplate(this.DEFAULT_TEMPLATE, parameters);
        }
    }
}
exports.TemplateManager = TemplateManager;
TemplateManager.DEFAULT_TEMPLATE = 'training-agent';
