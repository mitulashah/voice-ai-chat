# Voice AI Chat

A voice-based chat application that uses Azure OpenAI's Chat API and Azure Speech Services to conduct natural conversations with a large language model.

## Features

- Voice-to-text input using Azure Speech Recognition with custom audio processing
- Text-to-speech responses via Azure Cognitive Services Speech SDK
- Real-time chat interface with message history and AI avatars
- **Prompty template integration** for structured prompt management
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
   cd server
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
   cd client
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
│       │   ├── AIAvatar.tsx
│       │   ├── ChatHeader.tsx
│       │   └── ChatInterface.tsx
│       ├── hooks/          # Custom React hooks
│       │   ├── useAudioPlayer.ts
│       │   ├── useAzureSpeechRecognition.ts
│       │   └── useRetry.ts
│       ├── worklets/       # Audio worklet processors
│       │   └── pcm-processor.js
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

## Prompty Templates

This application uses Microsoft's Prompty format for managing prompt templates. Prompty provides a standardized way to define, version, and manage LLM prompts with YAML frontmatter and template content.

### Available Templates

- **training-agent.prompty**: The default voice-optimized training assistant
- **code-review.prompty**: Specialized template for code review assistance

### Template Configuration

Templates are located in `server/src/prompts/` and can be configured via environment variables:

```env
PROMPTY_TEMPLATE=training-agent
```

### Template Features

- **Environment Variable Support**: Templates can reference Azure configuration via `${env:VARIABLE_NAME}`
- **Parameter Substitution**: Dynamic content using `{{variable_name}}` syntax
- **Conditional Blocks**: Show/hide content based on parameters with `{% if condition %}`
- **Model Configuration**: Each template can specify its own model parameters (temperature, max_tokens, etc.)

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
- `PROMPTY_TEMPLATE`: The Prompty template to use (default: training-agent)

## Dependencies

### Frontend Dependencies

- **React 19** - Frontend framework
- **TypeScript** - Type safety and better developer experience
- **Material-UI (MUI) v7** - UI component library
- **Emotion** - CSS-in-JS library for styling
- **Framer Motion** - Animation library
- **Axios** - HTTP client for API requests
- **React Error Boundary** - Error handling components
- **React Router DOM** - Client-side routing
- **DiceBear** - Avatar generation library
- **Vite** - Build tool and development server

### Backend Dependencies

- **Node.js/Express** - Server framework
- **TypeScript** - Type safety
- **Azure OpenAI SDK** - Azure OpenAI integration
- **Microsoft Cognitive Services Speech SDK** - Azure Speech Services
- **Azure Identity** - Azure authentication
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management
- **ts-node** - TypeScript execution for development

## Backend API Structure (2025 Refactor)

The server code in `server/` is now modular and organized for maintainability:

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

### Refactor Steps Completed
- All endpoints are now modular and tested.
- Business logic is separated from routing.
- Centralized error handling and config.
- Type safety across the backend.

See `docs/features/plan-api.md` for the full refactor plan and checklist.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
