import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// Template type for agent templates
export interface Template {
  id: string;
  name: string;
  prompt: string;
}

interface TemplateContextData {
  templates: Template[];
  currentTemplate: Template | null;
  setCurrentTemplate: (template: Template) => void;
}

const TemplateContext = createContext<TemplateContextData>({
  templates: [],
  currentTemplate: null,
  setCurrentTemplate: () => {},
});

interface TemplateProviderProps {
  children: React.ReactNode;
}

export const TemplateProvider: React.FC<TemplateProviderProps> = ({ children }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);

  useEffect(() => {
    // Fetch available templates from API
    axios.get<{ success: boolean; templates: Template[]; count: number }>('/api/templates')
      .then(res => setTemplates(res.data.templates || []))
      .catch(err => console.error('Failed to load templates:', err));
  }, []);

  // Set default template to first in list after fetching
  useEffect(() => {
    if (templates.length > 0 && currentTemplate === null) {
      setCurrentTemplate(templates[0]);
    }
  }, [templates, currentTemplate]);

  return (
    <TemplateContext.Provider value={{ templates, currentTemplate, setCurrentTemplate }}>
      {children}
    </TemplateContext.Provider>
  );
};

export const useTemplate = () => useContext(TemplateContext);
