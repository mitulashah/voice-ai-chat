import express, { Express, Request, Response, NextFunction, RequestHandler } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import axios from 'axios';
import { Readable } from 'stream';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { v4 as uuidv4 } from 'uuid';

// Extend the SpeechSynthesisResult interface
declare module 'microsoft-cognitiveservices-speech-sdk' {
  interface SpeechSynthesisResult {
    audioData: ArrayBuffer;
    errorDetails: string;
  }
}

// Define types for request body
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: any;
  }
}

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors<Request>());
app.use(express.json());
app.use(express.static('public'));

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

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

// Function to generate speech using Azure TTS
export async function generateSpeech(text: string): Promise<Buffer> {
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

// Chat endpoint
app.post('/api/chat', (async (req: Request<{}, {}, ChatRequest>, res: Response) => {
  try {
    const { messages } = req.body;
    
    if (!openai) {
      return res.status(500).json({ error: 'Azure OpenAI not configured' });
    }

    if (!process.env.AZURE_OPENAI_DEPLOYMENT) {
      return res.status(500).json({ error: 'Azure OpenAI deployment not configured' });
    }

    const response = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT,
      messages,
      max_tokens: 800,
    });

    if (response.choices && response.choices[0] && response.choices[0].message) {
      res.json(response.choices[0].message);
    } else {
      throw new Error('No response from OpenAI');
    }
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
}) as RequestHandler);

// Audio generation endpoint
app.post('/api/audio/speech', (async (req: Request<{}, {}, { text: string }>, res: Response) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const audioBuffer = await generateSpeech(text);
    
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', audioBuffer.length);
    res.send(audioBuffer);
  } catch (error) {
    console.error('Error in audio generation endpoint:', error);
    res.status(500).json({ error: 'Failed to generate audio' });
  }
}) as RequestHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
