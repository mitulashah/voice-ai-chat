import React, { useState, useEffect } from 'react';
import apiClient from '../utils/apiClient';
import type { Template } from './template-types';
import { TemplateContext } from './template-context';
import { useAuth } from './AuthContext';

interface TemplateProviderProps {
  children: React.ReactNode;
}

const TemplateProvider: React.FC<TemplateProviderProps> = ({ children }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Only fetch templates if authenticated and not loading
    if (isAuthenticated && !isLoading) {
      apiClient.get<{ success: boolean; templates: Template[]; count: number }>('/api/templates')
        .then(res => setTemplates(res.data.templates || []))
        .catch(err => console.error('Failed to load templates:', err));
    }
  }, [isAuthenticated, isLoading]);

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
