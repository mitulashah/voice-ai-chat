import { useState, useCallback } from 'react';

interface AudioPlayerState {
  isPlaying: boolean;
  currentPlayingId: string | null;
  // playAudio now accepts optional voiceGender (e.g. 'male' or 'female')
  playAudio: (text: string, id: string, voiceGender?: string) => Promise<void>;
  stopAudio: () => void;
}

export const useAudioPlayer = (): AudioPlayerState => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Now accepts optional voiceGender to request male/female voice
  const playAudio = useCallback(async (text: string, id: string, voiceGender?: string) => {
    try {
      // Stop any currently playing audio
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }

      // Set loading state
      setIsPlaying(true);
      setCurrentPlayingId(id);

      // Call the backend to generate speech
      const response = await fetch('http://localhost:5000/api/speech/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, voiceGender }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate audio');
      }

      // Convert the response to a blob and create an object URL
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Create a new audio element and play it
      const audio = new Audio(audioUrl);
      setAudioElement(audio);

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentPlayingId(null);
      };

      audio.onerror = () => {
        console.error('Error playing audio');
        setIsPlaying(false);
        setCurrentPlayingId(null);
      };

      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
      setCurrentPlayingId(null);
    }
  }, [audioElement]);

  const stopAudio = useCallback(() => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentPlayingId(null);
  }, [audioElement]);

  return {
    isPlaying,
    currentPlayingId,
    playAudio,
    stopAudio,
  };
};
