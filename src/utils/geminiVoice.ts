export interface GeminiVoiceConfig {
  apiKey?: string;
  enabled: boolean;
  voiceId?: string; // Gemini voice ID
  model?: string; // Gemini model to use
}

export class GeminiVoiceSystem {
  private config: GeminiVoiceConfig;
  private audioContext: AudioContext | null = null;
  private isPlaying: boolean = false;

  constructor(config: GeminiVoiceConfig = {
    enabled: true,
    model: 'gemini-1.5-flash'
  }) {
    this.config = config;
    // Hardcode the API key
    this.config.apiKey = 'AIzaSyBWXLZirnMBowVOMDBezhptKHfIAanGs58';
  }

  public updateConfig(newConfig: Partial<GeminiVoiceConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  public async speak(text: string): Promise<void> {
    if (!this.config.enabled || !this.config.apiKey) {
      console.log('Gemini voice disabled or no API key');
      return;
    }

    if (this.isPlaying) {
      console.log('Already playing audio, skipping');
      return;
    }

    try {
      this.isPlaying = true;
      console.log('🎤 Gemini voice:', text);

      // For now, we'll use a fallback to TTS since Gemini voice API might not be available
      // In a real implementation, you would call Gemini's text-to-speech API here
      
      // Example of what the API call would look like:
      /*
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Convert this to speech: ${text}`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      });

      const data = await response.json();
      // Process the audio response and play it
      */

      // Fallback to browser TTS for now
      this.fallbackToTTS(text);

    } catch (error) {
      console.error('Gemini voice error:', error);
      // Fallback to TTS
      this.fallbackToTTS(text);
    } finally {
      this.isPlaying = false;
    }
  }

  private fallbackToTTS(text: string): void {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = 0.8;
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      
      // Try to find a good voice
      const voices = speechSynthesis.getVoices();
      const selectedVoice = voices.find(voice => 
        voice.lang === 'en-US' && voice.name.toLowerCase().includes('natural')
      ) || voices.find(voice => voice.lang === 'en-US');
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      speechSynthesis.speak(utterance);
    }
  }

  public stop(): void {
    this.isPlaying = false;
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  }

  public isEnabled(): boolean {
    return this.config.enabled && !!this.config.apiKey;
  }

  public setApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
  }
} 