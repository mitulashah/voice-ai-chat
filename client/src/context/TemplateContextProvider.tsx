import React, { useState, useEffect } from 'react';
import axios from 'axios';
import type { Template } from './template-types';
import { TemplateContext } from './template-context';

const API_BASE_URL = import.meta.env.VITE_API_URL;

interface TemplateProviderProps {
  children: React.ReactNode;
}

const TemplateProvider: React.FC<TemplateProviderProps> = ({ children }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);

  useEffect(() => {
    axios.get<{ success: boolean; templates: Template[]; count: number }>(`${API_BASE_URL}/api/templates`)
      .then(res => setTemplates(res.data.templates || []))
      .catch(err => console.error('Failed to load templates:', err));
  }, []);

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

export default TemplateProvider;
