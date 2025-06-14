import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { processAudioForSpeechRecognition } from '../speechService';
import { generateSpeech } from './speechUtil';
import { config } from '../config/env';
import statsService from './statsService';

export async function recognizeSpeech(audioData: string) {
  if (!audioData) throw new Error('No audio data provided');
  return await processAudioForSpeechRecognition(audioData);
}

export async function synthesizeSpeech(text: string, voiceGender?: 'male' | 'female') {
  if (!text) throw new Error('No text provided');
  // Record synthesized audio character count
  statsService.recordAudioChars(text.length);
  return await generateSpeech(text, voiceGender);
}

export async function synthesizeSpeechStream(text: string, voiceGender: 'male' | 'female' | undefined, res: any) {
  if (!text) throw new Error('No text provided');
  // Record synthesized audio character count
  statsService.recordAudioChars(text.length);
  const voiceName = voiceGender === 'male' ? 'en-US-AndrewNeural' : 'en-US-JennyNeural';
  const speechConfig = sdk.SpeechConfig.fromSubscription(
    config.azureSpeechKey,
    config.azureSpeechRegion
  );
  speechConfig.speechSynthesisVoiceName = voiceName;
  speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Raw16Khz16BitMonoPcm;
  res.setHeader('Content-Type', 'audio/wav');
  res.setHeader('Transfer-Encoding', 'chunked');
  const pushStream = sdk.AudioOutputStream.createPullStream();
  const audioConfig = sdk.AudioConfig.fromStreamOutput(pushStream);
  const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);
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
}
