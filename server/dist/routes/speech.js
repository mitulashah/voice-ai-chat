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
        const result = yield (0, speechServiceApi_1.recognizeSpeech)(audioData);
        res.json({ text: result });
    }
    catch (error) {
        res.status(500).json({ error: 'Speech recognition failed' });
    }
}));
// POST /api/speech/synthesize - Text-to-speech endpoint
router.post('/synthesize', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { text, voiceGender } = req.body;
        const audioBuffer = yield (0, speechServiceApi_1.synthesizeSpeech)(text, voiceGender);
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
        const { text, voiceGender } = req.body;
        yield (0, speechServiceApi_1.synthesizeSpeechStream)(text, voiceGender, res);
    }
    catch (error) {
        res.status(500).json({ error: 'Speech synthesis streaming failed' });
    }
}));
exports.default = router;
