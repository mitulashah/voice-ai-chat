import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import type { Persona, Scenario } from './persona-scenario-types';
import { generateRandomName, inferGenderFromPersona, type GeneratedName } from '../utils/nameGenerator';

interface PersonaScenarioContextData {
  personas: Persona[];
  scenarios: Scenario[];
  selectedPersona: Persona | null;
  setSelectedPersona: (persona: Persona) => void;
  selectedScenario: Scenario | null;
  setSelectedScenario: (scenario: Scenario) => void;
  generatedName: GeneratedName | null;
  loading: boolean;
  error: string | null;
}

const PersonaScenarioContext = createContext<PersonaScenarioContextData>({
  personas: [],
  scenarios: [],
  selectedPersona: null,
  setSelectedPersona: () => {},
  selectedScenario: null,
  setSelectedScenario: () => {},
  generatedName: null,
  loading: false,
  error: null,
});

export const PersonaScenarioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [generatedName, setGeneratedName] = useState<GeneratedName | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get<{ personas: Persona[] }>('/api/personas'),
      axios.get<{ scenarios: Scenario[] }>('/api/scenarios'),
    ])
      .then(([personaRes, scenarioRes]) => {
        setPersonas(personaRes.data.personas || []);
        setScenarios(scenarioRes.data.scenarios || []);
        setError(null);
      })
      .catch(() => {
        setError('Failed to load personas or scenarios');
      })
      .finally(() => setLoading(false));
  }, []);  // Generate a new name when persona changes
  useEffect(() => {
    if (selectedPersona) {
      // Try to infer gender from persona, or generate random
      const inferredGender = inferGenderFromPersona(selectedPersona);
      console.log('PersonaScenarioProvider: Generating name for persona:', selectedPersona.name, 'inferred gender:', inferredGender);
      const name = generateRandomName(inferredGender);
      console.log('PersonaScenarioProvider: Generated name:', name);
      setGeneratedName(name);
    } else {
      setGeneratedName(null);
    }
  }, [selectedPersona]);

  return (
    <PersonaScenarioContext.Provider value={{ 
      personas, 
      scenarios, 
      selectedPersona, 
      setSelectedPersona, 
      selectedScenario, 
      setSelectedScenario, 
      generatedName, 
      loading, 
      error 
    }}>
      {children}
    </PersonaScenarioContext.Provider>
  );
};

export const usePersonaScenario = (): PersonaScenarioContextData => {
  const context = useContext(PersonaScenarioContext);
  if (!context) {
    throw new Error('usePersonaScenario must be used within a PersonaScenarioProvider');
  }
  return context;
};
