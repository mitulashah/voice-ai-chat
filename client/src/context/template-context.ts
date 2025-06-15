import React, { createContext } from 'react';
import type { Template } from './template-types';

export interface TemplateContextData {
  templates: Template[];
  currentTemplate: Template | null;
  setCurrentTemplate: React.Dispatch<React.SetStateAction<Template | null>>;
}

export const TemplateContext = createContext<TemplateContextData>({
  templates: [],
  currentTemplate: null,
  setCurrentTemplate: () => {},
});
