import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { config } from '../config/env';

export async function generateSpeech(text: string, voiceGender?: 'male' | 'female'): Promise<Buffer> {
  // Determine voice
  const voiceName = voiceGender === 'male' ? 'en-US-AndrewNeural' : 'en-US-JennyNeural';
  return new Promise((resolve, reject) => {
    const speechConfig = sdk.SpeechConfig.fromSubscription(
      config.azureSpeechKey,
      config.azureSpeechRegion
    );
    speechConfig.speechSynthesisVoiceName = voiceName;
    speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio24Khz160KBitRateMonoMp3;
    const speechSynthesizer = new sdk.SpeechSynthesizer(speechConfig);
    const ssml = `
      <speak version="1.0" xml:lang="en-US">
        <voice name="${voiceName}">
          ${text}
        </voice>
      </speak>
    `;
    speechSynthesizer.speakSsmlAsync(
      ssml,
      (result: any) => {
        speechSynthesizer.close();
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted && result.audioData) {
          resolve(Buffer.from(result.audioData));
        } else {
          const errorMsg = result.errorDetails || 'Unknown error in speech synthesis';
          reject(new Error(`Speech synthesis failed: ${errorMsg}`));
        }
      },
      (error: any) => {
        speechSynthesizer.close();
        reject(new Error(error.message || 'Speech synthesis failed'));
      }
    );
  });
}
