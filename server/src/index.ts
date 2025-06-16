import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config/env';
import OpenAI from 'openai';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { errorHandler } from './middleware/errorHandler';
import { databaseServiceFactory } from './services/database-service-factory';
import personasRouter from './routes/personas';
import templatesRouter from './routes/templates';
import chatRouter from './routes/chat';
import speechRouter from './routes/speech';
import statsRouter from './routes/stats';
import tokenRouter from './routes/token';
import scenariosRouter from './routes/scenarios';
import moodsRouter from './routes/moods';

const app: Express = express();
const PORT = config.port;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Register personas router first
app.use('/api/personas', personasRouter);

// Initialize OpenAI client
let openai: OpenAI | null = null;

if (config.azureOpenAiEndpoint && config.azureOpenAiKey) {
  openai = new OpenAI({
    apiKey: config.azureOpenAiKey,
    baseURL: `${config.azureOpenAiEndpoint}/openai/deployments/${config.azureOpenAiDeployment}`,
    defaultQuery: { 'api-version': '2023-05-15' },
    defaultHeaders: { 'api-key': config.azureOpenAiKey },
  });
}

// Azure Speech Service Configuration
const AZURE_SPEECH_KEY = 'your-azure-speech-key';
const AZURE_SPEECH_REGION = 'your-azure-speech-region'; // e.g., 'eastus'

// Note: Replace these values with your actual Azure Speech Service credentials

// Azure TTS Configuration
const speechConfig = sdk.SpeechConfig.fromSubscription(
  config.azureSpeechKey,
  config.azureSpeechRegion
);

// Set the voice name (you can change this to a different voice if needed)
speechConfig.speechSynthesisVoiceName = 'en-US-JennyNeural';

// Set the output format to 24KHz audio
speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio24Khz160KBitRateMonoMp3;

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Register routes
app.use('/api/templates', templatesRouter);
app.use('/api/chat', chatRouter);
app.use('/api/speech', speechRouter);
app.use('/api/speech/token', tokenRouter);
app.use('/api/stats', statsRouter);
app.use('/api/scenarios', scenariosRouter);
app.use('/api/moods', moodsRouter);

// Error handling middleware
app.use(errorHandler);

// Initialize database service and start server
async function startServer() {
  try {
    console.log('🚀 Starting Voice AI Chat Server...');
    
    // Configure database service based on environment
    databaseServiceFactory.configure({
      useDatabaseByDefault: true, // Always use database for better performance
      fallbackToFiles: true, // Fallback to files if database fails
      dbPath: process.env.DATABASE_PATH // Allow custom database path
    });
    
    // Initialize database service
    console.log('🔧 Initializing database service...');
    await databaseServiceFactory.initializeDatabase();
    
    if (databaseServiceFactory.isDatabaseReady()) {
      console.log('✅ Database service ready - using database storage');
    } else {
      console.log('⚠️  Database service failed - using file-based fallback');
      const error = databaseServiceFactory.getInitializationError();
      if (error) {
        console.log(`   Error: ${error.message}`);
      }
    }
    
    // Start the Express server
    app.listen(PORT, () => {
      console.log(`\n🎉 Server is running on port ${PORT}`);
      console.log(`OpenAI client initialized: ${!!openai}`);
      console.log(`Azure Speech config initialized: ${!!speechConfig}`);
      console.log(`Database service status: ${databaseServiceFactory.isDatabaseReady() ? 'Ready' : 'Fallback mode'}`);
      console.log(`\n📊 Server ready for requests!`);
    });
    
  } catch (error) {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('\n🛑 Graceful shutdown initiated...');
  
  try {
    await databaseServiceFactory.close();
    console.log('✅ Database service closed');
  } catch (error) {
    console.error('❌ Error closing database service:', error);
  }
  
  console.log('👋 Server shut down successfully');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received, shutting down...');
  
  try {
    await databaseServiceFactory.close();
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
  }
  
  process.exit(0);
});

// Start the server
startServer();
