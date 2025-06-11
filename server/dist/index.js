"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSpeech = generateSpeech;
const express_1 = __importStar(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const openai_1 = __importDefault(require("openai"));
const sdk = __importStar(require("microsoft-cognitiveservices-speech-sdk"));
const speechService_1 = require("./speechService");
const promptyLoader_1 = require("./prompts/promptyLoader");
const templateManager_1 = require("./prompts/templateManager");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
// Error handler middleware
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
};
// Initialize OpenAI client
let openai = null;
if (process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_KEY) {
    openai = new openai_1.default({
        apiKey: process.env.AZURE_OPENAI_KEY,
        baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}`,
        defaultQuery: { 'api-version': '2023-05-15' },
        defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_KEY },
    });
}
// Azure Speech Service Configuration
const AZURE_SPEECH_KEY = 'your-azure-speech-key';
const AZURE_SPEECH_REGION = 'your-azure-speech-region'; // e.g., 'eastus'
// Note: Replace these values with your actual Azure Speech Service credentials
// Azure TTS Configuration
const speechConfig = sdk.SpeechConfig.fromSubscription(process.env.AZURE_SPEECH_KEY || 'your-azure-speech-key', process.env.AZURE_SPEECH_REGION || 'eastus');
// Set the voice name (you can change this to a different voice if needed)
speechConfig.speechSynthesisVoiceName = 'en-US-JennyNeural';
// Set the output format to 24KHz audio
speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio24Khz160KBitRateMonoMp3;
// Function to generate speech using Azure TTS
function generateSpeech(text) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            // Create a speech synthesizer
            const speechSynthesizer = new sdk.SpeechSynthesizer(speechConfig);
            // Generate SSML with the text
            const ssml = `
      <speak version="1.0" xml:lang="en-US">
        <voice name="${speechConfig.speechSynthesisVoiceName}">
          ${text}
        </voice>
      </speak>
    `;
            // Synthesize the text to speech
            speechSynthesizer.speakSsmlAsync(ssml, (result) => {
                speechSynthesizer.close();
                if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted && result.audioData) {
                    // Convert the audio data to a buffer
                    resolve(Buffer.from(result.audioData));
                }
                else {
                    const errorMsg = result.errorDetails || 'Unknown error in speech synthesis';
                    console.error('Speech synthesis failed:', errorMsg);
                    reject(new Error(`Speech synthesis failed: ${errorMsg}`));
                }
            }, (error) => {
                console.error('Error in speech synthesis:', error);
                speechSynthesizer.close();
                reject(new Error(error.message || 'Speech synthesis failed'));
            });
        });
    });
}
// Health check endpoint
app.get('/api/health', ((req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
}));
// Templates endpoint
app.get('/api/templates', ((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('handleGetTemplates called');
    try {
        // Use process.cwd() to get the current working directory (server folder)
        const promptsDir = path.join(__dirname, '..', 'src', 'prompts');
        console.log('Looking for prompts in:', promptsDir);
        console.log('Directory exists:', fs.existsSync(promptsDir));
        const files = fs.readdirSync(promptsDir);
        console.log('Files found:', files);
        // Filter for .prompty files only
        const promptyFiles = files.filter(file => file.endsWith('.prompty'));
        const templates = [];
        for (const file of promptyFiles) {
            try {
                const templateName = path.basename(file, '.prompty');
                const template = promptyLoader_1.PrompyLoader.loadTemplate(templateName);
                templates.push({
                    name: template.metadata.name,
                    description: template.metadata.description,
                    fileName: templateName
                });
            }
            catch (error) {
                console.warn(`Failed to load template ${file}:`, error);
                // Continue with other templates even if one fails
            }
        }
        res.json({
            success: true,
            templates: templates,
            count: templates.length
        });
    }
    catch (error) {
        console.error('Failed to load templates:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load available templates',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
})));
const router = (0, express_1.Router)();
// Speech recognition endpoint
const handleSpeechRecognition = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { audioData } = req.body;
        if (!audioData) {
            res.status(400).json({ error: 'No audio data provided' });
            return;
        }
        const result = yield (0, speechService_1.processAudioForSpeechRecognition)(audioData);
        res.json({ text: result });
    }
    catch (error) {
        console.error('Speech recognition error:', error);
        res.status(500).json({ error: 'Speech recognition failed' });
    }
});
// Chat completion endpoint
const handleChatCompletion = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!openai) {
            res.status(500).json({ error: 'OpenAI client not initialized' });
            return;
        }
        const { messages } = req.body; // Load and render the appropriate Prompty template based on context
        try {
            const { systemMessage, configuration } = templateManager_1.TemplateManager.getContextualPrompt(messages);
            // Prepare messages with system message from Prompty template
            const messagesWithSystem = [
                { role: 'system', content: systemMessage },
                ...messages
            ];
            const completion = yield openai.chat.completions.create({
                model: process.env.AZURE_OPENAI_MODEL || 'gpt-4',
                messages: messagesWithSystem,
                max_tokens: configuration.max_tokens || 800,
                temperature: configuration.temperature || 0.7,
                top_p: configuration.top_p || 0.95,
                frequency_penalty: configuration.frequency_penalty || 0,
                presence_penalty: configuration.presence_penalty || 0
            });
            res.json(completion.choices[0].message);
        }
        catch (promptError) {
            console.error('Prompty template error:', promptError);
            // Fallback to original behavior without template
            const completion = yield openai.chat.completions.create({
                model: process.env.AZURE_OPENAI_MODEL || 'gpt-4',
                messages: messages,
            });
            res.json(completion.choices[0].message);
        }
    }
    catch (error) {
        console.error('Chat completion error:', error);
        res.status(500).json({ error: 'Chat completion failed' });
    }
});
// Text-to-speech endpoint
const handleTextToSpeech = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { text } = req.body;
        if (!text) {
            res.status(400).json({ error: 'No text provided' });
            return;
        }
        const audioBuffer = yield generateSpeech(text);
        res.setHeader('Content-Type', 'audio/mp3');
        res.send(audioBuffer);
    }
    catch (error) {
        console.error('Speech synthesis error:', error);
        res.status(500).json({ error: 'Speech synthesis failed' });
    }
});
// Register routes
router.post('/api/speech/recognize', express_1.default.json({ limit: '50mb' }), handleSpeechRecognition);
router.post('/api/chat', handleChatCompletion);
router.post('/api/speech/synthesize', handleTextToSpeech);
// Use router
app.use(router);
// Error handling middleware
app.use(errorHandler);
// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`OpenAI client initialized: ${!!openai}`);
    console.log(`Azure Speech config initialized: ${!!speechConfig}`);
});
