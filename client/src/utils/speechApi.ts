/**
 * Fetches an Azure Speech Service token from the backend.
 * Returns an object with { token, region } or throws on error.
 */
export interface SpeechTokenResponse {
  token: string;
  region: string;
}

export async function fetchSpeechToken(): Promise<SpeechTokenResponse> {
  const response = await fetch('/api/speech/token');
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to fetch speech token');
  }
  return response.json();
}