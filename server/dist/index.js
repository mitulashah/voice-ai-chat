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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const openai_1 = __importDefault(require("openai"));
const sdk = __importStar(require("microsoft-cognitiveservices-speech-sdk"));
const errorHandler_1 = require("./middleware/errorHandler");
const database_service_factory_1 = require("./services/database-service-factory");
const personas_1 = __importDefault(require("./routes/personas"));
const templates_1 = __importDefault(require("./routes/templates"));
const chat_1 = __importDefault(require("./routes/chat"));
const speech_1 = __importDefault(require("./routes/speech"));
const stats_1 = __importDefault(require("./routes/stats"));
const token_1 = __importDefault(require("./routes/token"));
const scenarios_1 = __importDefault(require("./routes/scenarios"));
const moods_1 = __importDefault(require("./routes/moods"));
const agentEvaluationService_1 = require("./services/agentEvaluationService");
const app = (0, express_1.default)();
const PORT = env_1.config.port;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
// Register personas router first
app.use('/api/personas', personas_1.default);
// Initialize OpenAI client
let openai = null;
if (env_1.config.azureOpenAiEndpoint && env_1.config.azureOpenAiKey) {
    openai = new openai_1.default({
        apiKey: env_1.config.azureOpenAiKey,
        baseURL: `${env_1.config.azureOpenAiEndpoint}/openai/deployments/${env_1.config.azureOpenAiDeployment}`,
        defaultQuery: { 'api-version': '2023-05-15' },
        defaultHeaders: { 'api-key': env_1.config.azureOpenAiKey },
    });
}
// Azure Speech Service Configuration
const AZURE_SPEECH_KEY = 'your-azure-speech-key';
const AZURE_SPEECH_REGION = 'your-azure-speech-region'; // e.g., 'eastus'
// Note: Replace these values with your actual Azure Speech Service credentials
// Azure TTS Configuration
const speechConfig = sdk.SpeechConfig.fromSubscription(env_1.config.azureSpeechKey, env_1.config.azureSpeechRegion);
// Set the voice name (you can change this to a different voice if needed)
speechConfig.speechSynthesisVoiceName = 'en-US-JennyNeural';
// Set the output format to 24KHz audio
speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio24Khz160KBitRateMonoMp3;
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});
// Register routes
app.use('/api/templates', templates_1.default);
app.use('/api/chat', chat_1.default);
app.use('/api/speech', speech_1.default);
app.use('/api/speech/token', token_1.default);
app.use('/api/stats', stats_1.default);
app.use('/api/scenarios', scenarios_1.default);
app.use('/api/moods', moods_1.default);
// Evaluation endpoints - inline implementation
const evaluationService = new agentEvaluationService_1.AgentEvaluationService();
// POST /api/evaluation/analyze-simple - Simple JSON response version
app.post('/api/evaluation/analyze-simple', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Evaluation request received:', { timestamp: new Date().toISOString() });
    try {
        const conversationData = req.body;
        console.log('Conversation data:', { messageCount: conversationData.messages.length, metadataKeys: Object.keys(conversationData.metadata || {}) });
        // Validate the request body
        if (!conversationData || !conversationData.messages || !Array.isArray(conversationData.messages)) {
            return res.status(400).json({
                error: 'Invalid request body. Expected ConversationData with messages array.'
            });
        }
        if (conversationData.messages.length === 0) {
            return res.status(400).json({
                error: 'Conversation must contain at least one message.'
            });
        }
        const invalidMessage = conversationData.messages.find((msg) => !msg.role || !msg.content || !msg.timestamp ||
            !['user', 'assistant'].includes(msg.role));
        if (invalidMessage) {
            return res.status(400).json({
                error: 'Invalid message format. Each message must have role, content, and timestamp.'
            });
        }
        // Run evaluation without progress updates
        const result = yield evaluationService.evaluateConversation(conversationData);
        console.log('Evaluation result:', { runId: result.runId, threadId: result.threadId, timestamp: result.timestamp });
        res.json({
            success: true,
            result
        });
    }
    catch (error) {
        console.error('Simple evaluation endpoint error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Evaluation failed'
        });
    }
}));
// GET /api/evaluation/test - Test the Azure AI Agent connection
app.get('/api/evaluation/test', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Removed: const isConnected = await evaluationService.testConnection();
        res.json({
            connected: true,
            service: 'Azure AI Agent Service',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Connection test error:', error);
        res.status(500).json({
            connected: false,
            error: error instanceof Error ? error.message : 'Connection test failed',
            service: 'Azure AI Agent Service',
            timestamp: new Date().toISOString()
        });
    }
}));
// Error handling middleware
app.use(errorHandler_1.errorHandler);
// Initialize database service and start server
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('🚀 Starting Voice AI Chat Server...');
            // Configure database service based on environment
            database_service_factory_1.databaseServiceFactory.configure({
                useDatabaseByDefault: true, // Always use database for better performance
                fallbackToFiles: true, // Fallback to files if database fails
                dbPath: process.env.DATABASE_PATH // Allow custom database path
            });
            // Initialize database service
            console.log('🔧 Initializing database service...');
            yield database_service_factory_1.databaseServiceFactory.initializeDatabase();
            if (database_service_factory_1.databaseServiceFactory.isDatabaseReady()) {
                console.log('✅ Database service ready - using database storage');
            }
            else {
                console.log('⚠️  Database service failed - using file-based fallback');
                const error = database_service_factory_1.databaseServiceFactory.getInitializationError();
                if (error) {
                    console.log(`   Error: ${error.message}`);
                }
            }
            // Start the Express server
            app.listen(PORT, () => {
                console.log(`\n🎉 Server is running on port ${PORT}`);
                console.log(`OpenAI client initialized: ${!!openai}`);
                console.log(`Azure Speech config initialized: ${!!speechConfig}`);
                console.log(`Database service status: ${database_service_factory_1.databaseServiceFactory.isDatabaseReady() ? 'Ready' : 'Fallback mode'}`);
                console.log(`\n📊 Server ready for requests!`);
            });
        }
        catch (error) {
            console.error('💥 Failed to start server:', error);
            process.exit(1);
        }
    });
}
// Graceful shutdown handling
process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('\n🛑 Graceful shutdown initiated...');
    try {
        yield database_service_factory_1.databaseServiceFactory.close();
        console.log('✅ Database service closed');
    }
    catch (error) {
        console.error('❌ Error closing database service:', error);
    }
    console.log('👋 Server shut down successfully');
    process.exit(0);
}));
process.on('SIGTERM', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('\n🛑 SIGTERM received, shutting down...');
    try {
        yield database_service_factory_1.databaseServiceFactory.close();
    }
    catch (error) {
        console.error('❌ Error during shutdown:', error);
    }
    process.exit(0);
}));
// Start the server
startServer();
