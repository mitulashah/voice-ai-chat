import React, { createContext, useContext, useState } from 'react';

interface VoiceContextType {
  selectedVoice: string | null;
  setSelectedVoice: (voice: string | null) => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export const VoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);
  return (
    <VoiceContext.Provider value={{ selectedVoice, setSelectedVoice }}>
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = (): VoiceContextType => {
  const context = useContext(VoiceContext);
  if (!context) throw new Error('useVoice must be used within a VoiceProvider');
  return context;
};
