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
const router = (0, express_1.Router)();
// POST /api/chat - Chat completion endpoint
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { messages } = req.body;
        console.log('Received messages:', messages.map((m) => ({
            role: m.role,
            content: m.content.substring(0, 100) + (m.content.length > 100 ? '...' : '')
        })));
        const result = yield (0, chatService_1.getChatCompletion)(messages);
        // Ensure content is always a string and include usage data
        res.json({
            role: 'assistant',
            content: (_a = result.content) !== null && _a !== void 0 ? _a : '',
            usage: result.usage
        });
    }
    catch (error) {
        console.error('Chat endpoint error:', error);
        res.json({
            role: 'assistant',
            content: 'Sorry, I encountered an error processing your request. Please try again.'
        });
    }
}));
exports.default = router;
