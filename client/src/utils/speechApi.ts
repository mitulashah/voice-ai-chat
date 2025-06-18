import axios from 'axios';
import type { ScenarioParameters } from '../context/scenario-parameters';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Fetches an Azure Speech Service token from the backend.
 * Returns an object with { token, region } or throws on error.
 */
export interface SpeechTokenResponse {
  token: string;
  region: string;
}

export async function fetchSpeechToken(): Promise<SpeechTokenResponse> {
  const response = await fetch(`${API_BASE_URL}/api/speech/token`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to fetch speech token');
  }
  return response.json();
}

export async function fetchSubstitutedSystemPrompt(parameters: ScenarioParameters): Promise<string> {
  const response = await axios.post<{ systemPrompt: string }>(`${API_BASE_URL}/api/chat/system-prompt`, { parameters });
  return response.data.systemPrompt;
}