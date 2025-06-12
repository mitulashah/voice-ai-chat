import { useState, useCallback, useEffect, useRef } from 'react';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';

interface SpeechRecognitionState {
  isListening: boolean;
  error: string | null;
  startListening: () => Promise<void>;
  stopListening: () => void;
}

export const useAzureSpeechRecognition = (onTranscript: (text: string) => void): SpeechRecognitionState => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognizerRef = useRef<SpeechSDK.SpeechRecognizer | null>(null);
  const stopTimeoutRef = useRef<number | null>(null);

  // Replace with your actual Azure Speech credentials or load from env/config
  const AZURE_SPEECH_KEY = import.meta.env.VITE_AZURE_SPEECH_KEY || '';
  const AZURE_SPEECH_REGION = import.meta.env.VITE_AZURE_SPEECH_REGION || '';

  const cleanup = useCallback(() => {
    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }
    if (recognizerRef.current) {
      recognizerRef.current.close();
      recognizerRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(async () => {
    setError(null);
    cleanup();
    try {
      if (!AZURE_SPEECH_KEY || !AZURE_SPEECH_REGION) {
        setError('Azure Speech credentials are missing.');
        return;
      }
      const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
        AZURE_SPEECH_KEY,
        AZURE_SPEECH_REGION
      );
      speechConfig.speechRecognitionLanguage = 'en-US';
      // Use the default microphone
      const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
      const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
      recognizerRef.current = recognizer;
      setIsListening(true);

      recognizer.recognizing = () => {
        // Partial results (optional: can be used for live UI feedback)
      };
      recognizer.recognized = (_s, e) => {
        if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech && e.result.text) {
          onTranscript(e.result.text);
        }
      };
      recognizer.canceled = (_s, e) => {
        setError(`Recognition canceled: ${e.errorDetails || e.reason}`);
        cleanup();
      };
      recognizer.sessionStopped = () => {
        setIsListening(false);
        cleanup();
      };
      recognizer.startContinuousRecognitionAsync();
      // Timeout removed: recognition will continue until user stops it
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recognition');
      cleanup();
    }
  }, [AZURE_SPEECH_KEY, AZURE_SPEECH_REGION, cleanup, onTranscript]);

  const stopListening = useCallback(() => {
    if (recognizerRef.current) {
      recognizerRef.current.stopContinuousRecognitionAsync(() => {
        cleanup();
      }, (err) => {
        setError(typeof err === 'string' ? err : 'Failed to stop recognition');
        cleanup();
      });
    } else {
      cleanup();
    }
  }, [cleanup]);

  useEffect(() => cleanup, [cleanup]);

  return { isListening, error, startListening, stopListening };
};
