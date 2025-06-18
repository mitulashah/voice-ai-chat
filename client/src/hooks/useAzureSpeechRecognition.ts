import { useState, useCallback, useEffect, useRef } from 'react';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import { fetchSpeechToken } from '../utils/speechApi';

interface SpeechRecognitionState {
  isListening: boolean;
  error: string | null;
  startListening: () => Promise<void>;
  stopListening: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const useAzureSpeechRecognition = (onTranscript: (text: string) => void): SpeechRecognitionState => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speechToken, setSpeechToken] = useState<string | null>(null);
  const [speechRegion, setSpeechRegion] = useState<string | null>(null);
  const recognizerRef = useRef<SpeechSDK.SpeechRecognizer | null>(null);
  const stopTimeoutRef = useRef<number | null>(null);
  // Track start and end time for speech duration
  const sessionStartTime = useRef<number | null>(null);
  const sessionEndTime = useRef<number | null>(null);

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

  // Fetch token on mount
  useEffect(() => {
    let isMounted = true;
    fetchSpeechToken()
      .then(({ token, region }) => {
        if (isMounted) {
          setSpeechToken(token);
          setSpeechRegion(region);
        }
      })
      .catch((err) => {
        setError('Failed to fetch speech token: ' + (err instanceof Error ? err.message : String(err)));
      });
    return () => { isMounted = false; };
  }, []);

  const startListening = useCallback(async () => {
    setError(null);
    cleanup();
    try {
      if (!speechToken || !speechRegion) {
        setError('Speech token or region is missing.');
        return;
      }
      
      const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(
        speechToken,
        speechRegion
      );
      speechConfig.speechRecognitionLanguage = 'en-US';        // Optimized audio configuration for natural speech with good responsiveness
      speechConfig.setProperty(SpeechSDK.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, "5000");
      speechConfig.setProperty(SpeechSDK.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs, "600");
      speechConfig.setProperty(SpeechSDK.PropertyId.Speech_SegmentationSilenceTimeoutMs, "600");
      
      // Enable detailed logging and profanity filtering
      speechConfig.enableDictation();
      speechConfig.setProperty(SpeechSDK.PropertyId.SpeechServiceResponse_RequestDetailedResultTrueFalse, "true");
      
      // Use the default microphone
      const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
      
      const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
      recognizerRef.current = recognizer;
      
      setIsListening(true);
      // Mark session start
      sessionStartTime.current = Date.now();
      sessionEndTime.current = null;

      recognizer.recognizing = () => {
        // Partial results (optional: can be used for live UI feedback)
      };
      recognizer.recognized = (_s, e) => {
        if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech && e.result.text) {
          onTranscript(e.result.text);
        }
      };
      recognizer.sessionStarted = () => {
        // Session started
      };
      recognizer.sessionStopped = () => {
        setIsListening(false);
        // Mark session end
        sessionEndTime.current = Date.now();
        // Calculate and send duration
        if (sessionStartTime.current && sessionEndTime.current) {
          const durationMs = sessionEndTime.current - sessionStartTime.current;
          if (durationMs > 0) {
            fetch(`${API_BASE_URL}/api/stats/speech-duration`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ seconds: durationMs / 1000 })
            }).catch(() => {/* ignore errors for now */});
          }
        }
        cleanup();
      };
      recognizer.speechStartDetected = () => {
        // Speech start detected
      };
      recognizer.speechEndDetected = () => {
        // Speech end detected
      };
      recognizer.canceled = (_s, e) => {
        setError(`Recognition canceled: ${e.errorDetails || e.reason}`);
        cleanup();
      };
      
      recognizer.startContinuousRecognitionAsync();
      
      // Timeout removed: recognition will continue until user stops it
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recognition');
      cleanup();
    }
  }, [cleanup, onTranscript, speechRegion, speechToken]);

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
