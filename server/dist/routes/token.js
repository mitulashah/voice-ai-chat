"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
const router = (0, express_1.Router)();
// GET / - Retrieve Azure Speech Service token (mounted at /api/speech/token)
router.get('/', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    const speechKey = env_1.config.azureSpeechKey;
    const speechRegion = env_1.config.azureSpeechRegion;
    if (!speechKey || !speechRegion || speechKey === 'your-azure-speech-key' || speechRegion === 'your-azure-speech-region') {
        res.status(400).json({ error: 'Speech key or region is not configured in the server environment.' });
        return;
    }
    axios_1.default.post(`https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, null, {
        headers: {
            'Ocp-Apim-Subscription-Key': speechKey,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    })
        .then(tokenResponse => {
        res.json({ token: tokenResponse.data, region: speechRegion });
    })
        .catch(() => {
        res.status(401).json({ error: 'There was an error authorizing your speech key.' });
    });
});
exports.default = router;
