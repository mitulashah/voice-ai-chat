"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processAudioForSpeechRecognition = processAudioForSpeechRecognition;
const sdk = __importStar(require("microsoft-cognitiveservices-speech-sdk"));
const fsExtra = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const statsService_1 = __importDefault(require("./services/statsService"));
// Function to perform speech recognition
function performSpeechRecognition(wavFilePath) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Starting speech recognition for:', wavFilePath);
        console.log('Azure Speech Key:', process.env.AZURE_SPEECH_KEY ? `${process.env.AZURE_SPEECH_KEY.substring(0, 8)}...` : 'MISSING');
        console.log('Azure Speech Region:', process.env.AZURE_SPEECH_REGION || 'MISSING');
        const audioConfig = sdk.AudioConfig.fromWavFileInput(yield fsExtra.readFile(wavFilePath));
        const speechConfig = sdk.SpeechConfig.fromSubscription(process.env.AZURE_SPEECH_KEY || '', process.env.AZURE_SPEECH_REGION || '');
        speechConfig.speechRecognitionLanguage = 'en-US';
        const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);
        try {
            return yield new Promise((resolve, reject) => {
                let isCompleted = false;
                recognizer.recognizeOnceAsync(result => {
                    isCompleted = true;
                    resolve(result);
                }, error => {
                    if (!isCompleted) {
                        reject(error);
                    }
                });
                setTimeout(() => {
                    if (!isCompleted) {
                        recognizer.stopContinuousRecognitionAsync();
                        reject(new Error('Recognition timeout'));
                    }
                }, 10000);
            });
        }
        finally {
            recognizer.close();
        }
    });
}
function processAudioForSpeechRecognition(audioData) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        console.log('processAudioForSpeechRecognition called with audioData length:', (audioData === null || audioData === void 0 ? void 0 : audioData.length) || 'undefined');
        if (!audioData) {
            console.error('No audio data provided');
            throw new Error('No audio data provided');
        }
        const tempDir = path.join(__dirname, 'temp');
        yield fsExtra.ensureDir(tempDir);
        const timestamp = Date.now().toString();
        const inputPath = path.join(tempDir, `input-${timestamp}.wav`);
        try {
            // Decode and save WAV directly from client
            const audioBuffer = Buffer.from(audioData, 'base64');
            // Save raw audio for recognition
            if (audioBuffer.length === 0) {
                throw new Error('Empty audio data provided');
            }
            yield fsExtra.writeFile(inputPath, audioBuffer);
        }
        catch (error) {
            throw new Error('Invalid audio data format');
        }
        try {
            const result = yield performSpeechRecognition(inputPath);
            if (result.reason === sdk.ResultReason.RecognizedSpeech) {
                const text = result.text.trim();
                if (!text) {
                    throw new Error('No speech was detected in the audio');
                }
                // Record actual speech duration from recognition result (ticks -> seconds)
                const durationSec = ((_a = result.duration) !== null && _a !== void 0 ? _a : 0) / 10000000;
                statsService_1.default.recordSpeechDuration(durationSec);
                return text;
            }
            else if (result.reason === sdk.ResultReason.NoMatch) {
                const noMatchDetail = sdk.NoMatchDetails.fromResult(result);
                let errorMessage = 'Failed to recognize speech: ';
                switch (noMatchDetail.reason) {
                    case sdk.NoMatchReason.NotRecognized:
                        errorMessage += 'Speech was detected but not recognized. Please speak clearly and try again.';
                        break;
                    case sdk.NoMatchReason.InitialSilenceTimeout:
                        errorMessage += 'No speech was detected. Please check your microphone and try again.';
                        break;
                    default:
                        errorMessage += 'Unable to process speech. Please try again.';
                }
                throw new Error(errorMessage);
            }
            else {
                throw new Error(`Speech recognition failed: ${result.reason}`);
            }
        }
        finally {
            // Clean up temp file
            try {
                yield fsExtra.remove(inputPath).catch(() => { });
            }
            catch (err) {
                console.error('Error cleaning up temp file:', err);
            }
        }
    });
}
