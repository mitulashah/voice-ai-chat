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
exports.recognizeSpeech = recognizeSpeech;
exports.synthesizeSpeech = synthesizeSpeech;
exports.synthesizeSpeechStream = synthesizeSpeechStream;
const sdk = __importStar(require("microsoft-cognitiveservices-speech-sdk"));
const speechService_1 = require("../speechService");
const speechUtil_1 = require("./speechUtil");
const env_1 = require("../config/env");
const statsService_1 = __importDefault(require("./statsService"));
function recognizeSpeech(audioData) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!audioData)
            throw new Error('No audio data provided');
        return yield (0, speechService_1.processAudioForSpeechRecognition)(audioData);
    });
}
function synthesizeSpeech(text, voiceGender) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!text)
            throw new Error('No text provided');
        // Record synthesized audio character count
        statsService_1.default.recordAudioChars(text.length);
        return yield (0, speechUtil_1.generateSpeech)(text, voiceGender);
    });
}
function synthesizeSpeechStream(text, voiceGender, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!text)
            throw new Error('No text provided');
        // Record synthesized audio character count
        statsService_1.default.recordAudioChars(text.length);
        const voiceName = voiceGender === 'male' ? 'en-US-AndrewNeural' : 'en-US-JennyNeural';
        const speechConfig = sdk.SpeechConfig.fromSubscription(env_1.config.azureSpeechKey, env_1.config.azureSpeechRegion);
        speechConfig.speechSynthesisVoiceName = voiceName;
        speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Raw16Khz16BitMonoPcm;
        res.setHeader('Content-Type', 'audio/wav');
        res.setHeader('Transfer-Encoding', 'chunked');
        const pushStream = sdk.AudioOutputStream.createPullStream();
        const audioConfig = sdk.AudioConfig.fromStreamOutput(pushStream);
        const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);
        const ssml = `
    <speak version="1.0" xml:lang="en-US">
      <voice name="${voiceName}">
        ${text}
      </voice>
    </speak>
  `;
        let responseEnded = false;
        synthesizer.speakSsmlAsync(ssml, result => {
            synthesizer.close();
        }, error => {
            synthesizer.close();
            if (!responseEnded) {
                responseEnded = true;
                res.status(500).json({ error: 'Speech synthesis failed' });
            }
        });
        const buffer = Buffer.alloc(4096);
        (function readAndSend() {
            return __awaiter(this, void 0, void 0, function* () {
                let bytesRead = yield pushStream.read(buffer);
                while (bytesRead > 0) {
                    if (!responseEnded) {
                        res.write(buffer.slice(0, bytesRead));
                    }
                    bytesRead = yield pushStream.read(buffer);
                }
                if (!responseEnded) {
                    responseEnded = true;
                    res.end();
                }
            });
        })();
    });
}
