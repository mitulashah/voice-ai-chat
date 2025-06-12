import express, { Express, Request, Response, NextFunction, Router, RequestHandler } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { processAudioForSpeechRecognition } from './speechService';
import { PrompyLoader } from './prompts/promptyLoader';
import { TemplateManager } from './prompts/templateManager';
import * as fsExtra from 'fs-extra';
import * as path from 'path';
import * as fs from 'fs';

// Type definitions
type AsyncRequestHandler<T = any> = (
  req: Request<any, any, T>,
  res: Response,
  next: NextFunction
) => Promise<void>;

interface AudioRecognitionRequest {
  audioData: string;
}

interface TextSynthesisRequest {
  text: string;
  // Optional gender for voice synthesis ('male' | 'female')
  voiceGender?: 'male' | 'female';
}

// Define types for request body
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
}

interface TemplateInfo {
  name: string;
  description: string;
  fileName: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: any;
  }
}

// Extend the SpeechSynthesisResult interface
declare module 'microsoft-cognitiveservices-speech-sdk' {
  interface SpeechSynthesisResult {
    audioData: ArrayBuffer;
    errorDetails: string;
  }
}

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Error handler middleware
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
};

// Initialize OpenAI client
let openai: OpenAI | null = null;

if (process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_KEY) {
  openai = new OpenAI({
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
const speechConfig = sdk.SpeechConfig.fromSubscription(
  process.env.AZURE_SPEECH_KEY || 'your-azure-speech-key',
  process.env.AZURE_SPEECH_REGION || 'eastus'
);

// Set the voice name (you can change this to a different voice if needed)
speechConfig.speechSynthesisVoiceName = 'en-US-JennyNeural';

// Set the output format to 24KHz audio
speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio24Khz160KBitRateMonoMp3;

// Function to generate speech using Azure TTS, with optional gender selection
export async function generateSpeech(text: string, voiceGender?: 'male' | 'female'): Promise<Buffer> {
  // Determine voice
  const voiceName = voiceGender === 'male' ? 'en-US-AndrewNeural' : 'en-US-JennyNeural';
  console.log('generateSpeech using voiceName:', voiceName);
  return new Promise((resolve, reject) => {
    // Create a new speech config per request to set voice gender
    const config = sdk.SpeechConfig.fromSubscription(
      process.env.AZURE_SPEECH_KEY || 'your-azure-speech-key',
      process.env.AZURE_SPEECH_REGION || 'eastus'
    );
    // Select voice based on gender: male uses GuyNeural, female uses JennyNeural by default
    config.speechSynthesisVoiceName = voiceName;
    config.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio24Khz160KBitRateMonoMp3;
    const speechSynthesizer = new sdk.SpeechSynthesizer(config);
    
    // Generate SSML with the selected voice
    const ssml = `
      <speak version="1.0" xml:lang="en-US">
        <voice name="${voiceName}">
          ${text}
        </voice>
      </speak>
    `;

    // Synthesize the text to speech
    speechSynthesizer.speakSsmlAsync(
      ssml,
      (result: any) => {
        speechSynthesizer.close();
        
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted && result.audioData) {
          // Convert the audio data to a buffer
          resolve(Buffer.from(result.audioData));
        } else {
          const errorMsg = result.errorDetails || 'Unknown error in speech synthesis';
          console.error('Speech synthesis failed:', errorMsg);
          reject(new Error(`Speech synthesis failed: ${errorMsg}`));
        }
      },
      (error: any) => {
        console.error('Error in speech synthesis:', error);
        speechSynthesizer.close();
        reject(new Error(error.message || 'Speech synthesis failed'));
      }
    );
  });
}

// Health check endpoint
app.get('/api/health', ((req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Server is running' });
}) as RequestHandler);

// Templates endpoint
app.get('/api/templates', (async (req: Request, res: Response) => {
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
    
    const templates: any[] = [];
    for (const file of promptyFiles) {
      const templateName = path.basename(file, '.prompty');
      try {
        const { metadata, content } = PrompyLoader.loadTemplate(templateName);
        
        templates.push({
          id: templateName,
          name: metadata.name,
          description: metadata.description,
          prompt: content
        });
      } catch (error) {
        console.warn(`Failed to load template ${file}:`, error);
        // Continue with other templates even if one fails
      }
    }

    res.json({
      success: true,
      templates: templates,
      count: templates.length
    });
  } catch (error) {
    console.error('Failed to load templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load available templates',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}) as AsyncRequestHandler);

const router = Router();

// Speech recognition endpoint
const handleSpeechRecognition: AsyncRequestHandler<AudioRecognitionRequest> = async (req, res) => {
  try {
    const { audioData } = req.body;
    if (!audioData) {
      res.status(400).json({ error: 'No audio data provided' });
      return;
    }

    const result = await processAudioForSpeechRecognition(audioData);
    res.json({ text: result });
  } catch (error) {
    console.error('Speech recognition error:', error);
    res.status(500).json({ error: 'Speech recognition failed' });
  }
};

// Chat completion endpoint
const handleChatCompletion: AsyncRequestHandler<ChatRequest> = async (req, res) => {
  try {
    if (!openai) {
      res.status(500).json({ error: 'OpenAI client not initialized' });
      return;
    }

    const { messages } = req.body;    // Load and render the appropriate Prompty template based on context
    try {
      const { systemMessage, configuration } = TemplateManager.getContextualPrompt(messages);

      // Prepare messages with system message from Prompty template
      const messagesWithSystem: ChatMessage[] = [
        { role: 'system', content: systemMessage },
        ...messages
      ];

      const completion = await openai.chat.completions.create({
        model: process.env.AZURE_OPENAI_MODEL || 'gpt-4',
        messages: messagesWithSystem,
        max_tokens: configuration.max_tokens || 800,
        temperature: configuration.temperature || 0.7,
        top_p: configuration.top_p || 0.95,
        frequency_penalty: configuration.frequency_penalty || 0,
        presence_penalty: configuration.presence_penalty || 0
      });

      res.json(completion.choices[0].message);
    } catch (promptError) {
      console.error('Prompty template error:', promptError);
      // Fallback to original behavior without template
      const completion = await openai.chat.completions.create({
        model: process.env.AZURE_OPENAI_MODEL || 'gpt-4',
        messages: messages,
      });
      res.json(completion.choices[0].message);
    }
  } catch (error) {
    console.error('Chat completion error:', error);
    // Fallback assistant response to avoid errors on client
    res.json({ role: 'assistant', content: 'Sorry, I encountered an error processing your request. Please try again.' });
  }
};

// Text-to-speech endpoint
const handleTextToSpeech: AsyncRequestHandler<TextSynthesisRequest> = async (req, res) => {
  try {
    const { text, voiceGender } = req.body;
    console.log('TTS request received, voiceGender:', voiceGender);
    if (!text) {
      res.status(400).json({ error: 'No text provided' });
      return;
    }

    const audioBuffer = await generateSpeech(text, voiceGender);
    res.setHeader('Content-Type', 'audio/mp3');
    res.send(audioBuffer);
  } catch (error) {
    console.error('Speech synthesis error:', error);
    res.status(500).json({ error: 'Speech synthesis failed' });
  }
};

// Text-to-speech streaming endpoint (real-time audio chunks)
router.post('/api/speech/synthesize/stream', async (req, res) => {
  try {
    const { text, voiceGender } = req.body;
    if (!text) {
      res.status(400).json({ error: 'No text provided' });
      return;
    }
    const voiceName = voiceGender === 'male' ? 'en-US-AndrewNeural' : 'en-US-JennyNeural';
    const config = sdk.SpeechConfig.fromSubscription(
      process.env.AZURE_SPEECH_KEY || 'your-azure-speech-key',
      process.env.AZURE_SPEECH_REGION || 'eastus'
    );
    config.speechSynthesisVoiceName = voiceName;
    config.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Raw16Khz16BitMonoPcm;
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Transfer-Encoding', 'chunked');
    const pushStream = sdk.AudioOutputStream.createPullStream();
    const audioConfig = sdk.AudioConfig.fromStreamOutput(pushStream);
    const synthesizer = new sdk.SpeechSynthesizer(config, audioConfig);
    const ssml = `
      <speak version="1.0" xml:lang="en-US">
        <voice name="${voiceName}">
          ${text}
        </voice>
      </speak>
    `;
    let responseEnded = false;
    synthesizer.speakSsmlAsync(
      ssml,
      result => {
        synthesizer.close();
        // Do not call res.end() here; let the streaming loop handle it
      },
      error => {
        synthesizer.close();
        if (!responseEnded) {
          responseEnded = true;
          res.status(500).json({ error: 'Speech synthesis failed' });
        }
      }
    );
    const buffer = Buffer.alloc(4096);
    (async function readAndSend() {
      let bytesRead = await pushStream.read(buffer);
      while (bytesRead > 0) {
        if (!responseEnded) {
          res.write(buffer.slice(0, bytesRead));
        }
        bytesRead = await pushStream.read(buffer);
      }
      if (!responseEnded) {
        responseEnded = true;
        res.end();
      }
    })();
  } catch (error) {
    res.status(500).json({ error: 'Speech synthesis streaming failed' });
  }
});

// Register routes
router.post('/api/speech/recognize', express.json({ limit: '50mb' }), handleSpeechRecognition);
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
