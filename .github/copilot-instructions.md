# GitHub Copilot Instructions

This document provides coding standards and best practices for our TypeScript, React, and Node.js voice AI chat application.

## General Development Guidelines

- Always use TypeScript with strict mode enabled
- Prefer functional programming patterns over imperative ones
- Use descriptive variable and function names that clearly indicate their purpose
- Write self-documenting code with meaningful comments for complex business logic
- Follow the DRY (Don't Repeat Yourself) principle
- Use early returns to reduce nesting and improve readability
- DON'T ask permission to write code, just write it
- Have a strong recommendation and perform that task.  Only list alternatives if there are significant trade-offs.
- When generating terminal commands, use Windows Powershell syntax and ALWAYS include full paths for clarity

## TypeScript Best Practices

### Type Safety
- Always define explicit types for function parameters and return values
- Use union types and type guards instead of `any`
- Leverage TypeScript's strict compiler options
- Define interfaces for all data structures and API responses
- Use `const assertions` for immutable data structures
- Prefer `unknown` over `any` when the type is truly unknown

```typescript
// Good
interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date;
  role: 'user' | 'assistant';
}

function sendMessage(message: ChatMessage): Promise<void> {
  // Implementation
}

// Avoid
function sendMessage(message: any): any {
  // Implementation
}
```

### Modern TypeScript Features
- Use utility types (`Partial<T>`, `Pick<T>`, `Omit<T>`, etc.)
- Leverage template literal types for string validation
- Use discriminated unions for complex state management
- Implement generic constraints when creating reusable components

## React Best Practices

### Component Architecture
- Use functional components with hooks instead of class components
- Keep components small and focused on a single responsibility
- Use custom hooks to encapsulate and reuse stateful logic
- Implement proper error boundaries for production resilience
- Use React.memo() for performance optimization when appropriate

### State Management
- Use `useState` for local component state
- Use `useReducer` for complex state logic
- Implement context providers for global state (as seen in your ChatContext)
- Avoid prop drilling by using context or state management libraries
- Use `useCallback` and `useMemo` to optimize expensive computations

```typescript
// Good
const ChatInterface: React.FC = () => {
  const { messages, sendMessage } = useContext(ChatContext);
  
  const handleSendMessage = useCallback((content: string) => {
    sendMessage({ content, timestamp: new Date() });
  }, [sendMessage]);

  return (
    // JSX implementation
  );
};
```

### Event Handling
- Use proper TypeScript event types (`React.MouseEvent`, `React.ChangeEvent`, etc.)
- Prevent unnecessary re-renders by using `useCallback` for event handlers
- Handle async operations properly with error boundaries

### Performance
- Lazy load components using `React.lazy()` and `Suspense`
- Use `React.memo()` for components that receive the same props frequently
- Implement virtualization for large lists
- Optimize bundle size with code splitting

## Node.js & Express Best Practices

### Project Structure
- Follow a clear separation of concerns (routes, services, middleware)
- Use dependency injection for better testability
- Implement proper error handling middleware
- Use environment-specific configurations

### API Design
- Follow RESTful conventions for endpoint naming
- Use proper HTTP status codes
- Implement request validation using libraries like Joi or Zod
- Use middleware for cross-cutting concerns (logging, authentication, CORS)

```typescript
// Good
app.post('/api/chat/messages', 
  validateRequest(messageSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await chatService.sendMessage(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
);
```

### Error Handling
- Always use proper error handling in async functions
- Implement centralized error handling middleware
- Log errors with appropriate levels (info, warn, error)
- Never expose sensitive information in error responses

### Security
- Validate and sanitize all input data
- Use HTTPS in production
- Implement rate limiting for API endpoints
- Use environment variables for sensitive configuration
- Keep dependencies updated and audit for vulnerabilities

## Code Style & Formatting

### Naming Conventions
- Use PascalCase for React components and TypeScript interfaces
- Use camelCase for variables, functions, and methods
- Use SCREAMING_SNAKE_CASE for constants
- Use kebab-case for file names (except React components)

### File Organization
- Group related files in feature-based folders
- Use barrel exports (index.ts files) for cleaner imports
- Keep file names descriptive and consistent
- Separate concerns into different files (types, utils, components)

### Import/Export Guidelines
- Use named exports instead of default exports when possible
- Group imports: external libraries first, then internal modules
- Use absolute imports for cleaner import statements
- Avoid circular dependencies

```typescript
// Good
import React, { useState, useCallback } from 'react';
import { Button, TextField } from '@mui/material';

import { ChatMessage } from '../types/api';
import { useChatContext } from '../context/ChatContext';
import { formatMessage } from '../utils/messageUtils';
```

## Testing Guidelines

### Unit Testing
- Write unit tests for all business logic
- Use Jest and React Testing Library for React components
- Test error scenarios and edge cases
- Aim for high test coverage but focus on critical paths

### Integration Testing
- Test API endpoints with proper request/response validation
- Test React components with user interactions
- Mock external dependencies appropriately

## Performance Considerations

### Frontend Performance
- Implement code splitting at the route level
- Use React.memo() for expensive components
- Optimize images and assets
- Implement proper loading states

### Backend Performance
- Use connection pooling for database connections
- Implement caching strategies where appropriate
- Use streaming for large data transfers
- Monitor and optimize database queries

## Documentation Standards

- Document all public APIs with JSDoc comments
- Keep README files up to date with setup instructions
- Document complex business logic and algorithms
- Use TypeScript interfaces as living documentation

## Git & Development Workflow

- Use conventional commit messages
- Create feature branches for new development
- Keep pull requests focused and small
- Write descriptive commit messages that explain the "why"

## Environment & Configuration

- Use environment variables for all configuration
- Never commit secrets or API keys
- Use different configurations for development, testing, and production
- Implement proper logging levels for different environments

## Voice AI & Speech-Specific Guidelines

Given this is a voice AI chat application:

- Handle audio processing asynchronously with proper error handling
- Implement proper cleanup for audio resources and WebRTC connections
- Use Web Workers for intensive audio processing tasks
- Handle network interruptions gracefully in speech recognition
- Implement proper accessibility features for voice interactions
- Use proper TypeScript types for audio-related APIs

```typescript
// Example for speech recognition
interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

const useSpeechRecognition = (): {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
} => {
  // Implementation with proper error handling and cleanup
};
```

## Code Review Checklist

When reviewing code, ensure:
- [ ] TypeScript strict mode compliance
- [ ] Proper error handling
- [ ] Performance considerations addressed
- [ ] Security best practices followed
- [ ] Tests written for new functionality
- [ ] Documentation updated where necessary
- [ ] No console.log statements in production code
- [ ] Proper cleanup of resources (listeners, timers, etc.)

Remember: Write code that your future self and your teammates will thank you for!
