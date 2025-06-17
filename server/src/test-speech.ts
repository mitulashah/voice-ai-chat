import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { config } from './config/env';

async function testAzureSpeechService() {
  console.log('Testing Azure Speech Service Configuration...');
  console.log('Key:', config.azureSpeechKey ? `${config.azureSpeechKey.substring(0, 8)}...` : 'MISSING');
  console.log('Region:', config.azureSpeechRegion);

  try {
    // Test 1: Create speech config
    const speechConfig = sdk.SpeechConfig.fromSubscription(
      config.azureSpeechKey,
      config.azureSpeechRegion
    );
    speechConfig.speechRecognitionLanguage = 'en-US';
    console.log('✅ Speech config created successfully');

    // Test 2: Try to create a recognizer (this will validate credentials)
    const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
    console.log('✅ Speech recognizer created successfully');
    
    recognizer.close();
    console.log('✅ All Azure Speech Service tests passed');
    
  } catch (error) {
    console.error('❌ Azure Speech Service test failed:', error);
    
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  }
}

// Run the test
testAzureSpeechService().catch(console.error);
