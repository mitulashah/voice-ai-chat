# Voice AI Chat

A voice-based chat application that uses Azure OpenAI's Whisper and Chat APIs to conduct natural conversations with a large language model.

## Features

- Voice-to-text input using the Web Speech API
- Text-to-speech responses
- Real-time chat interface with message history
- Built with React, TypeScript, and Material-UI on the frontend
- Node.js/Express backend with TypeScript
- Azure OpenAI integration for natural language processing

## Prerequisites

- Node.js (v18 or higher)
- npm (v8 or higher) or yarn
- Azure OpenAI service with a deployed model

## Setup

### Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the server directory with the following variables:
   ```env
   PORT=5000
   AZURE_OPENAI_ENDPOINT=your-azure-openai-endpoint
   AZURE_OPENAI_KEY=your-azure-openai-key
   AZURE_OPENAI_DEPLOYMENT=your-deployment-name
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
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
│       ├── App.tsx          # Main App component
│       └── main.tsx         # Entry point
└── server/                  # Backend server
    ├── src/
    │   └── index.ts       # Main server file
    ├── .env                # Environment variables
    └── package.json        # Backend dependencies
```

## Environment Variables

### Backend

- `PORT`: The port the server will run on (default: 5000)
- `AZURE_OPENAI_ENDPOINT`: Your Azure OpenAI endpoint URL
- `AZURE_OPENAI_KEY`: Your Azure OpenAI API key
- `AZURE_OPENAI_DEPLOYMENT`: The name of your Azure OpenAI deployment

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
