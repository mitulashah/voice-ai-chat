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
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSpeech = generateSpeech;
const sdk = __importStar(require("microsoft-cognitiveservices-speech-sdk"));
const env_1 = require("../config/env");
function generateSpeech(text, voiceGender, voiceName) {
    return __awaiter(this, void 0, void 0, function* () {
        let resolvedVoiceName;
        if (voiceName) {
            // Map UI value to Azure full voice name
            if (voiceName === 'JennyNeural')
                resolvedVoiceName = 'en-US-JennyNeural';
            else if (voiceName === 'AndrewNeural')
                resolvedVoiceName = 'en-US-AndrewNeural';
            else if (voiceName === 'FableNeural')
                resolvedVoiceName = 'en-US-FableTurboMultilingualNeural';
            else if (voiceName === 'en-US-Alloy:DragonHDLatestNeural')
                resolvedVoiceName = 'en-US-Alloy:DragonHDLatestNeural';
            else
                resolvedVoiceName = voiceGender === 'male' ? 'en-US-AndrewNeural' : 'en-US-JennyNeural';
        }
        else {
            resolvedVoiceName = voiceGender === 'male' ? 'en-US-AndrewNeural' : 'en-US-JennyNeural';
        }
        console.log(`[TTS] Using Azure voice: ${resolvedVoiceName}`);
        return new Promise((resolve, reject) => {
            const speechConfig = sdk.SpeechConfig.fromSubscription(env_1.config.azureSpeechKey, env_1.config.azureSpeechRegion);
            speechConfig.speechSynthesisVoiceName = resolvedVoiceName;
            speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio24Khz160KBitRateMonoMp3;
            const speechSynthesizer = new sdk.SpeechSynthesizer(speechConfig);
            const ssml = `
      <speak version="1.0" xml:lang="en-US">
        <voice name="${resolvedVoiceName}">
          ${text}
        </voice>
      </speak>
    `;
            speechSynthesizer.speakSsmlAsync(ssml, (result) => {
                speechSynthesizer.close();
                if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted && result.audioData) {
                    resolve(Buffer.from(result.audioData));
                }
                else {
                    const errorMsg = result.errorDetails || 'Unknown error in speech synthesis';
                    reject(new Error(`Speech synthesis failed: ${errorMsg}`));
                }
            }, (error) => {
                speechSynthesizer.close();
                reject(new Error(error.message || 'Speech synthesis failed'));
            });
        });
    });
}
