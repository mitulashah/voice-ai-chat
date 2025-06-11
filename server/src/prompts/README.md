# Prompty Templates

This directory contains Prompty template files for the Voice AI Chat application. Prompty is Microsoft's standardized format for prompt templates that enhance observability, understandability, and portability.

## What is Prompty?

Prompty is an asset class and format for LLM prompts that includes:
- YAML frontmatter for metadata and configuration
- Template content with variable substitution
- Support for environment variables
- Model configuration parameters

## Available Templates

### 1. training-agent.prompty
The main template for the voice-based training agent. Provides a helpful, encouraging AI assistant optimized for voice conversations.

**Parameters:**
- `user_name`: The user's name (optional)
- `conversation_context`: Previous conversation history
- `user_input`: The current user message

### 2. code-review.prompty
A specialized template for code review assistance.

**Parameters:**
- `code_snippet`: The code to review
- `programming_language`: The programming language of the code
- `review_focus`: Specific areas to focus the review on

## Template Structure

```yaml
---
name: Template Name
description: Template description
authors:
  - Author Name
model:
  api: chat
  configuration:
    type: azure_openai
    azure_endpoint: ${env:AZURE_OPENAI_ENDPOINT}
    azure_deployment: ${env:AZURE_OPENAI_DEPLOYMENT}
    api_version: "2023-05-15"
    max_tokens: 800
    temperature: 0.7
    # ... other model parameters
parameters:
  parameter_name: string
---

# Template content with variables
{{parameter_name}} can be used in the content.

{% if conditional_parameter %}
Conditional content shown only if parameter exists
{% endif %}
```

## Using Templates in Code

```typescript
import { PrompyLoader } from './prompts/promptyLoader';

// Load and render a template
const { systemMessage, configuration } = PrompyLoader.renderTemplate('training-agent', {
  user_name: 'John',
  conversation_context: 'Previous messages...',
  user_input: 'Current user question'
});

// Use in OpenAI API call
const completion = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'system', content: systemMessage },
    ...otherMessages
  ],
  max_tokens: configuration.max_tokens,
  temperature: configuration.temperature,
  // ... other configuration options
});
```

## Environment Variables

Templates can reference environment variables using the syntax:
```yaml
azure_endpoint: ${env:AZURE_OPENAI_ENDPOINT}
```

Make sure these environment variables are set in your `.env` file:
- `AZURE_OPENAI_ENDPOINT`
- `AZURE_OPENAI_DEPLOYMENT`
- `AZURE_OPENAI_KEY`

## Template Syntax

### Variable Substitution
- `{{variable_name}}` - Simple variable substitution
- Variables are replaced with their string values

### Conditional Blocks
- `{% if variable_name %}content{% endif %}` - Show content only if variable exists and is truthy
- Useful for optional sections based on available data

## Creating New Templates

1. Create a new `.prompty` file in this directory
2. Include proper YAML frontmatter with metadata and configuration
3. Define parameters in the frontmatter
4. Write the prompt content using variable substitution
5. Update the PrompyLoader usage in your code to reference the new template

## Best Practices

1. **Clear Naming**: Use descriptive names for templates and parameters
2. **Documentation**: Include helpful descriptions in the frontmatter
3. **Parameter Validation**: Handle missing or invalid parameters gracefully
4. **Environment Variables**: Use environment variables for sensitive configuration
5. **Version Control**: Keep templates in version control for collaboration
6. **Testing**: Test templates with various parameter combinations

## VS Code Extension

Consider installing the [Prompty VS Code Extension](https://marketplace.visualstudio.com/items?itemName=ms-toolsai.prompty) for:
- Syntax highlighting
- Template preview
- Quick testing and debugging
- IntelliSense support

## Resources

- [Prompty Documentation](https://prompty.ai/)
- [Microsoft Prompty GitHub Repository](https://github.com/microsoft/prompty)
- [Azure OpenAI Documentation](https://docs.microsoft.com/en-us/azure/cognitive-services/openai/)
