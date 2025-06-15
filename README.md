# Voice AI Chat

A voice-based chat application that uses Azure OpenAI's Chat API and Azure Speech Services to conduct natural conversations with a large language model.

## Features

- Voice-to-text input using Azure Speech Recognition with custom audio processing
- Text-to-speech responses via Azure Cognitive Services Speech SDK
- Real-time chat interface with message history and AI avatars
- **Prompty template integration** for structured prompt management
- Supports multiple personas and prompt templates (easily extendable)
- Built with React 19, TypeScript, and Material-UI (MUI) v7 on the frontend
- Node.js/Express backend with TypeScript
- Azure OpenAI integration for natural language processing
- Custom audio worklets for PCM audio processing
- Framer Motion animations for enhanced UI interactions
- Error boundary handling with react-error-boundary
- Responsive design with custom Material-UI theming

## Prerequisites

- Node.js (v18 or higher)
- npm (v8 or higher) or yarn
- Azure OpenAI service with a deployed model
- Azure Speech Services for speech recognition and synthesis

## Setup

### Backend Setup

1. Navigate to the server directory:
   ```powershell
   cd d:\code\voice-ai-chat\server
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Create a `.env` file in the server directory with the following variables:
   ```env
   PORT=5000
   AZURE_OPENAI_ENDPOINT=your-azure-openai-endpoint
   AZURE_OPENAI_KEY=your-azure-openai-key
   AZURE_OPENAI_DEPLOYMENT=your-deployment-name
   AZURE_SPEECH_KEY=your-azure-speech-service-key
   AZURE_SPEECH_REGION=your-azure-speech-service-region
   ```

4. Start the development server:
   ```powershell
   npm run dev
   ```

### Frontend Setup

1. Navigate to the client directory:
   ```powershell
   cd d:\code\voice-ai-chat\client
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Start the development server:
   ```powershell
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

1. Click the microphone button to start speaking
2. The app will convert your speech to text and send it to the AI
3. The AI's response will be displayed and read aloud
4. You can also type your message in the input field and press Enter or click the send button

## Project Structure

```
voice-ai-chat/
├── client/                 # Frontend React application
│   ├── public/             # Static files
│   └── src/                # Source files
│       ├── components/      # React components
│       ├── hooks/          # Custom React hooks
│       ├── worklets/       # Audio worklet processors
│       ├── App.tsx         # Main App component
│       └── main.tsx        # Entry point
└── server/                 # Backend server
    ├── src/
    │   ├── index.ts        # Main server file
    │   ├── speechService.ts # Azure Speech Service integration
    │   ├── prompts/        # AI prompt templates
    │   └── types/          # TypeScript type definitions
    ├── .env                # Environment variables
    └── package.json        # Backend dependencies
```

## Personas & Prompts

The app supports multiple personas and prompt templates, which can be easily extended by adding new files to the appropriate folders. See the `server/src/personas/` and `server/src/prompts/` directories for examples.

## Prompty Templates

This application uses Microsoft's Prompty format for managing prompt templates. Prompty provides a standardized way to define, version, and manage LLM prompts with YAML frontmatter and template content.

Templates are located in `server/src/prompts/` and can be configured via environment variables:

```env
PROMPTY_TEMPLATE=your-template-name
```

For more details, see the [Prompts README](server/src/prompts/README.md).

## Environment Variables

### Backend

- `PORT`: The port the server will run on (default: 5000)
- `AZURE_OPENAI_ENDPOINT`: Your Azure OpenAI endpoint URL
- `AZURE_OPENAI_KEY`: Your Azure OpenAI API key
- `AZURE_OPENAI_DEPLOYMENT`: The name of your Azure OpenAI deployment
- `AZURE_OPENAI_MODEL`: The model to use (e.g., gpt-4, gpt-4o)
- `AZURE_SPEECH_KEY`: Your Azure Speech Services API key
- `AZURE_SPEECH_REGION`: Your Azure Speech Services region
- `PROMPTY_TEMPLATE`: The Prompty template to use

## Dependencies (2025)

### Frontend
- react@19.1.0
- @mui/material@7.1.1
- @mui/icons-material@7.1.1
- axios@1.9.0
- microsoft-cognitiveservices-speech-sdk@1.44.1
- react-error-boundary@6.0.0
- react-markdown@10.1.0
- react-router-dom@7.6.2
- remark-gfm@4.0.1

### Backend
- express@5.1.0
- typescript@5.8.3
- ts-node@10.9.2
- @azure/openai@2.0.0
- axios@1.10.0
- chokidar@4.0.3
- cors@2.8.5
- dotenv@16.5.0
- fs-extra@11.3.0
- js-yaml@4.1.0
- microsoft-cognitiveservices-speech-sdk@1.44.1
- openai@5.2.0
- sql.js@1.13.0

#### Backend Dev Dependencies
- @types/express@5.0.3
- @types/fs-extra@11.0.4
- @types/js-yaml@4.0.9
- @types/cors@2.8.19
- @types/sql.js@1.4.9

## Backend API Structure (2025 Refactor)

The server code in `server/` is modular and organized for maintainability:

- **src/routes/** — All API endpoints, grouped by feature (e.g., `personas.ts`, `templates.ts`, `chat.ts`, `speech.ts`).
- **src/services/** — Business logic and utility functions for each feature.
- **src/types/** — Shared TypeScript types/interfaces for API objects.
- **src/config/env.ts** — Centralized environment/configuration logic.
- **src/middleware/errorHandler.ts** — Centralized error handling middleware.

### Example: Adding a New API Feature
1. Add a new route file in `src/routes/` (e.g., `myfeature.ts`).
2. Add business logic in `src/services/` if needed.
3. Add or reuse types in `src/types/`.
4. Register the new router in `src/index.ts`.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
