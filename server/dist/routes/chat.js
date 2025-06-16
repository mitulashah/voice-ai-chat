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
const express_1 = require("express");
const chatService_1 = require("../services/chatService");
const templateManager_1 = require("../prompts/templateManager");
const router = (0, express_1.Router)();
// POST /api/chat - Chat completion endpoint
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { messages, parameters } = req.body;
        const result = yield (0, chatService_1.getChatCompletion)(messages, undefined, parameters);
        // Ensure content is always a string and include usage data
        res.json({
            role: 'assistant',
            content: (_a = result.content) !== null && _a !== void 0 ? _a : '',
            usage: result.usage
        });
    }
    catch (error) {
        res.json({
            role: 'assistant',
            content: 'Sorry, I encountered an error processing your request. Please try again.'
        });
    }
}));
// POST /api/chat/system-prompt - Get substituted system prompt
router.post('/system-prompt', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { parameters } = req.body;
        console.log('Received parameters:', parameters);
        // Use TemplateManager to get substituted system prompt
        const { systemMessage } = yield templateManager_1.TemplateManager.getContextualPrompt([], parameters);
        console.log('Generated system message:', systemMessage);
        res.json({ systemPrompt: systemMessage });
    }
    catch (error) {
        console.error('Error in /system-prompt:', error);
        res.status(500).json({ systemPrompt: 'Error generating system prompt.' });
    }
}));
exports.default = router;
