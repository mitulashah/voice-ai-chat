"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateManager = void 0;
const promptyLoader_1 = require("./promptyLoader");
const env_1 = require("../config/env");
const scenarioService_1 = require("../services/scenarioService");
const personaService_1 = require("../services/personaService");
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
        const conversationContext = messages.slice(-env_1.config.messageWindowSize)
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
    } /**
     * Gets the appropriate system message and configuration for the current context
     */
    static getContextualPrompt(messages, parameters, userContext) {
        return __awaiter(this, void 0, void 0, function* () {
            // Use template name from parameters if provided, otherwise use default selection logic
            let templateName;
            if (parameters === null || parameters === void 0 ? void 0 : parameters.templateName) {
                // Map UI template names to prompty file names
                const templateMapping = {
                    'Customer Simulation': 'generic-simulation',
                    'Chat Agent': 'chat-agent',
                    'Training Agent': 'chat-agent', // fallback
                };
                templateName = templateMapping[parameters.templateName] || 'chat-agent';
            }
            else {
                templateName = this.selectTemplate(messages, userContext);
            }
            // Start with provided parameters or extract from messages
            let templateParameters = parameters !== null && parameters !== void 0 ? parameters : this.extractParameters(messages, templateName);
            // If persona is provided, fetch persona details from files/database
            if (templateParameters.persona) {
                try {
                    console.log('TemplateManager: Looking up persona:', templateParameters.persona);
                    const persona = yield (0, personaService_1.getPersonaById)(templateParameters.persona);
                    if (persona) {
                        console.log('TemplateManager: Found persona details for:', templateParameters.persona, persona);
                        // Replace the persona ID with detailed persona information
                        const personaFormatted = (0, personaService_1.formatPersonaForTemplate)(persona);
                        templateParameters = Object.assign(Object.assign({}, templateParameters), personaFormatted);
                        // Don't delete the persona parameter since formatPersonaForTemplate sets it to the rich description
                        console.log('TemplateManager: Updated parameters with persona details:', templateParameters);
                    }
                    else {
                        console.warn('TemplateManager: Persona not found:', templateParameters.persona);
                        // Keep the original persona value as fallback
                    }
                }
                catch (error) {
                    console.warn('TemplateManager: Failed to fetch persona details:', error);
                    // Keep the original persona value as fallback
                }
            }
            // If scenarioId is provided, fetch scenario details from database
            if (templateParameters.scenarioId) {
                try {
                    console.log('TemplateManager: Looking up scenario:', templateParameters.scenarioId);
                    const scenario = yield (0, scenarioService_1.getScenarioById)(templateParameters.scenarioId);
                    if (scenario) {
                        console.log('TemplateManager: Found scenario details for:', templateParameters.scenarioId, scenario);
                        // Replace simple scenario details with comprehensive scenario information
                        const scenarioFormatted = (0, scenarioService_1.formatScenarioForTemplate)(scenario);
                        templateParameters = Object.assign(Object.assign({}, templateParameters), scenarioFormatted);
                        // Don't delete scenarioId since formatScenarioForTemplate doesn't set it
                        console.log('TemplateManager: Updated parameters with scenario details:', templateParameters);
                    }
                    else {
                        console.warn('TemplateManager: Scenario not found:', templateParameters.scenarioId);
                        // Continue with default values
                        templateParameters.scenario_details = 'General inquiry';
                        templateParameters.exit_criteria = 'Issue resolved and customer satisfied';
                    }
                }
                catch (error) {
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
                return promptyLoader_1.PrompyLoader.renderTemplate(templateName, templateParameters);
            }
            catch (error) {
                console.warn(`Failed to load template ${templateName}, falling back to default:`, error);
                // Fallback to default template
                return promptyLoader_1.PrompyLoader.renderTemplate(this.DEFAULT_TEMPLATE, templateParameters);
            }
        });
    }
}
exports.TemplateManager = TemplateManager;
TemplateManager.DEFAULT_TEMPLATE = 'chat-agent';
