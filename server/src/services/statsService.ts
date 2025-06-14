import { Stats } from '../types/api';

class StatsService {
  private stats: Stats = { llmTokenCount: 0, speechDurationSeconds: 0, audioCharacterCount: 0 };

  recordTokens(count: number): void {
    this.stats.llmTokenCount += count;
  }

  recordSpeechDuration(seconds: number): void {
    this.stats.speechDurationSeconds += seconds;
  }

  recordAudioChars(count: number): void {
    this.stats.audioCharacterCount += count;
  }

  getStats(): Stats {
    return { ...this.stats };
  }
}

export default new StatsService();
