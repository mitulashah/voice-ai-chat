import { useState, useCallback, useEffect, useRef } from 'react';

// Helper to encode Float32 PCM into WAV
function encodeWav(buffer: Float32Array, sampleRate: number): ArrayBuffer {
  const bytesPerSample = 2;
  const blockAlign = bytesPerSample * 1;
  const byteRate = sampleRate * blockAlign;
  const dataSize = buffer.length * bytesPerSample;
  const bufferLength = 44 + dataSize;
  const view = new DataView(new ArrayBuffer(bufferLength));
  /* RIFF identifier */ writeString(view, 0, 'RIFF');
  /* file length */ view.setUint32(4, 36 + dataSize, true);
  /* RIFF type */ writeString(view, 8, 'WAVE');
  /* format chunk identifier */ writeString(view, 12, 'fmt ');
  /* format chunk length */ view.setUint32(16, 16, true);
  /* sample format (raw) */ view.setUint16(20, 1, true);
  /* channel count */ view.setUint16(22, 1, true);
  /* sample rate */ view.setUint32(24, sampleRate, true);
  /* byte rate */ view.setUint32(28, byteRate, true);
  /* block align */ view.setUint16(32, blockAlign, true);
  /* bits per sample */ view.setUint16(34, bytesPerSample * 8, true);
  /* data chunk identifier */ writeString(view, 36, 'data');
  /* data chunk length */ view.setUint32(40, dataSize, true);
  // PCM samples
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    const s = Math.max(-1, Math.min(1, buffer[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }
  return view.buffer;

  function writeString(dataview: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      dataview.setUint8(offset + i, str.charCodeAt(i));
    }
  }
}

interface SpeechRecognitionState {
  isListening: boolean;
  error: string | null;
  startListening: () => Promise<void>;
  stopListening: () => void;
}

export const useAzureSpeechRecognition = (onTranscript: (text: string) => void): SpeechRecognitionState => {
  // Add Web Audio API refs for PCM capture inside hook
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<AudioWorkletNode | ScriptProcessorNode | null>(null);
  const pcmChunksRef = useRef<Float32Array[]>([]);

  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const cleanup = useCallback(() => {
    // stop timeout
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    // stop media tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    // disconnect processor and close audio context
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    // reset flags
    setIsListening(false);
    // clear pcm chunks
    pcmChunksRef.current = [];
  }, []);

  // Replace startListening with Web Audio capture
  const startListening = useCallback(async () => {
    try {
      setError(null);
      cleanup();
      // request mic
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      await audioContext.resume();
      const sourceNode = audioContext.createMediaStreamSource(stream);
      sourceRef.current = sourceNode;
      pcmChunksRef.current = [];
      if (audioContext.audioWorklet) {
        try {
          await audioContext.audioWorklet.addModule(new URL('../worklets/pcm-processor.js', import.meta.url));
          const workletNode = new AudioWorkletNode(audioContext, 'pcm-processor');
          processorRef.current = workletNode;
          workletNode.port.onmessage = event => {
            console.log('PCM chunk received:', event.data.length);
            pcmChunksRef.current.push(new Float32Array(event.data));
          };
          sourceNode.connect(workletNode);
          workletNode.connect(audioContext.destination);
        } catch (e) {
          console.error('AudioWorklet failed, falling back to ScriptProcessorNode', e);
          const proc = audioContext.createScriptProcessor(4096, 1, 1);
          processorRef.current = proc;
          proc.onaudioprocess = ev => {
            const input = ev.inputBuffer.getChannelData(0);
            console.log('ScriptProcessor chunk:', input.length);
            pcmChunksRef.current.push(new Float32Array(input));
          };
          sourceNode.connect(proc);
          proc.connect(audioContext.destination);
        }
      } else {
        console.warn('AudioWorklet not supported, using ScriptProcessorNode');
        const proc = audioContext.createScriptProcessor(4096, 1, 1);
        processorRef.current = proc;
        proc.onaudioprocess = ev => {
          const input = ev.inputBuffer.getChannelData(0);
          console.log('Legacy chunk:', input.length);
          pcmChunksRef.current.push(new Float32Array(input));
        };
        sourceNode.connect(proc);
        proc.connect(audioContext.destination);
      }
      setIsListening(true);
      // auto-stop after max duration
      timeoutRef.current = window.setTimeout(() => stopListening(), 30000);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Recording failed');
      cleanup();
    }
  }, [cleanup]);

  // Replace stopListening to finalize PCM, encode WAV, and post
  const stopListening = useCallback(() => {
    // ensure audio context is available
    const ctx = audioContextRef.current;
    if (!ctx) {
      cleanup();
      return;
    }
    // capture sample rate and PCM data before cleanup
    const sampleRate = ctx.sampleRate;
    const chunks = pcmChunksRef.current;
    if (chunks.length === 0) {
      cleanup();
      setError('No audio data captured.');
      return;
    }
    // tear down audio nodes
    cleanup();
    // flatten PCM data
    const totalLength = chunks.reduce((sum, arr) => sum + arr.length, 0);
    const floatBuffer = new Float32Array(totalLength);
    let offset = 0;
    chunks.forEach(arr => { floatBuffer.set(arr, offset); offset += arr.length; });
    // encode WAV using captured sampleRate
    const wavBuffer = encodeWav(floatBuffer, sampleRate);
    const blob = new Blob([wavBuffer], { type: 'audio/wav' });
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        const res = await fetch('http://localhost:5000/api/speech/recognize', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ audioData: base64 })
        });
        const data = await res.json();
        if (data.text) onTranscript(data.text);
        else setError(data.error || 'No transcript received');
      } catch {
        setError('Transcription failed');
      }
    };
    reader.onerror = () => setError('Failed to read audio file');
    reader.readAsDataURL(blob);
  }, [cleanup, onTranscript]);

  useEffect(() => cleanup, [cleanup]);

  return { isListening, error, startListening, stopListening };
};
