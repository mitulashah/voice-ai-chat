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
const speechServiceApi_1 = require("../services/speechServiceApi");
const router = (0, express_1.Router)();
// POST /api/speech/recognize - Speech recognition endpoint
router.post('/recognize', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { audioData } = req.body;
        console.log('Speech recognition request received, audioData length:', (audioData === null || audioData === void 0 ? void 0 : audioData.length) || 'undefined');
        const result = yield (0, speechServiceApi_1.recognizeSpeech)(audioData);
        console.log('Speech recognition successful:', result);
        res.json({ text: result });
    }
    catch (error) {
        console.error('Speech recognition failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            error: 'Speech recognition failed',
            details: errorMessage,
            type: error instanceof Error ? error.constructor.name : 'Unknown'
        });
    }
}));
// POST /api/speech/synthesize - Text-to-speech endpoint
router.post('/synthesize', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { text, voiceGender, voiceName } = req.body;
        const audioBuffer = yield (0, speechServiceApi_1.synthesizeSpeech)(text, voiceGender, voiceName);
        res.setHeader('Content-Type', 'audio/mp3');
        res.send(audioBuffer);
    }
    catch (error) {
        res.status(500).json({ error: 'Speech synthesis failed' });
    }
}));
// POST /api/speech/synthesize/stream - Streaming TTS endpoint
router.post('/synthesize/stream', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { text, voiceGender, voiceName } = req.body;
        yield (0, speechServiceApi_1.synthesizeSpeechStream)(text, voiceGender, res, voiceName);
    }
    catch (error) {
        res.status(500).json({ error: 'Speech synthesis streaming failed' });
    }
}));
exports.default = router;
