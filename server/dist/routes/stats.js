"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const statsService_1 = __importDefault(require("../services/statsService"));
const router = (0, express_1.Router)();
// GET /api/stats - return aggregated usage stats
router.get('/', (_req, res) => {
    const stats = statsService_1.default.getStats();
    res.json(stats);
});
// POST /api/stats/speech-duration - record frontend speech duration
router.post('/speech-duration', (req, res) => {
    const { seconds } = req.body;
    console.log('Received speech duration POST:', seconds);
    if (typeof seconds !== 'number' || seconds < 0) {
        console.log('Invalid seconds value:', seconds);
        return res.status(400).json({ error: 'Invalid seconds value' });
    }
    statsService_1.default.recordSpeechDuration(seconds);
    console.log('Updated stats:', statsService_1.default.getStats());
    res.status(204).send();
});
exports.default = router;
