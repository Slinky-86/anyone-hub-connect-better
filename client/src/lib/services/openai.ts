/**
 * OpenAI Service for client-side operations
 * Replaces server-side OpenAI utilities
 */
export class OpenAIService {
  private apiKey: string | null = null;

  /**
   * Initialize with API key (from environment or user input)
   */
  initialize(apiKey?: string): void {
    this.apiKey = apiKey || import.meta.env.VITE_OPENAI_API_KEY || null;
  }

  /**
   * Check if OpenAI API key is available
   * Replaces: GET /api/check-openai-key
   */
  isAvailable(): boolean {
    return !!this.apiKey;
  }

  /**
   * Transcribe audio file using OpenAI Whisper
   * Replaces: POST /api/transcribe
   */
  async transcribeAudio(audioFile: File): Promise<{ text?: string; error?: string }> {
    try {
      if (!this.apiKey) {
        return { error: 'OpenAI API key not available' };
      }

      // Validate file type
      const validTypes = [
        'audio/wav',
        'audio/mpeg', 
        'audio/mp3',
        'audio/m4a',
        'audio/ogg',
        'audio/webm',
        'audio/flac'
      ];

      if (!validTypes.includes(audioFile.type)) {
        return { error: 'Invalid audio file type' };
      }

      // Validate file size (25MB limit for OpenAI)
      const maxSize = 25 * 1024 * 1024; // 25MB
      if (audioFile.size > maxSize) {
        return { error: 'Audio file size exceeds 25MB limit' };
      }

      // Prepare form data
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('model', 'whisper-1');
      formData.append('language', 'en'); // Can be made configurable
      formData.append('response_format', 'text');

      // Make request to OpenAI API
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        return { error: errorData.error?.message || `API error: ${response.status}` };
      }

      const transcription = await response.text();
      
      return { text: transcription.trim() };
    } catch (error) {
      console.error('Transcribe audio error:', error);
      return { error: 'Failed to transcribe audio' };
    }
  }

  /**
   * Transcribe audio with language detection
   */
  async transcribeAudioWithDetection(audioFile: File): Promise<{ text?: string; language?: string; error?: string }> {
    try {
      if (!this.apiKey) {
        return { error: 'OpenAI API key not available' };
      }

      // Validate file
      const validTypes = [
        'audio/wav',
        'audio/mpeg', 
        'audio/mp3',
        'audio/m4a',
        'audio/ogg',
        'audio/webm',
        'audio/flac'
      ];

      if (!validTypes.includes(audioFile.type)) {
        return { error: 'Invalid audio file type' };
      }

      const maxSize = 25 * 1024 * 1024; // 25MB
      if (audioFile.size > maxSize) {
        return { error: 'Audio file size exceeds 25MB limit' };
      }

      // Prepare form data with verbose response to get language
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('model', 'whisper-1');
      formData.append('response_format', 'verbose_json');

      // Make request to OpenAI API
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        return { error: errorData.error?.message || `API error: ${response.status}` };
      }

      const result = await response.json();
      
      return { 
        text: result.text?.trim(), 
        language: result.language 
      };
    } catch (error) {
      console.error('Transcribe audio with detection error:', error);
      return { error: 'Failed to transcribe audio with language detection' };
    }
  }

  /**
   * Generate text using OpenAI GPT (optional feature)
   */
  async generateText(prompt: string, maxTokens: number = 150): Promise<{ text?: string; error?: string }> {
    try {
      if (!this.apiKey) {
        return { error: 'OpenAI API key not available' };
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'user', content: prompt }
          ],
          max_tokens: maxTokens,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        return { error: errorData.error?.message || `API error: ${response.status}` };
      }

      const result = await response.json();
      const text = result.choices?.[0]?.message?.content?.trim();
      
      return { text };
    } catch (error) {
      console.error('Generate text error:', error);
      return { error: 'Failed to generate text' };
    }
  }

  /**
   * Get API key status info
   */
  getApiKeyInfo(): { hasKey: boolean; source?: string } {
    if (!this.apiKey) {
      return { hasKey: false };
    }

    const source = import.meta.env.VITE_OPENAI_API_KEY ? 'environment' : 'manual';
    
    return { 
      hasKey: true, 
      source 
    };
  }

  /**
   * Set API key manually
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * Clear API key
   */
  clearApiKey(): void {
    this.apiKey = null;
  }

  /**
   * Test API key validity
   */
  async testApiKey(apiKey?: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const testKey = apiKey || this.apiKey;
      
      if (!testKey) {
        return { valid: false, error: 'No API key provided' };
      }

      // Test with a minimal request
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${testKey}`,
        },
      });

      if (response.ok) {
        return { valid: true };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return { 
          valid: false, 
          error: errorData.error?.message || 'Invalid API key' 
        };
      }
    } catch (error) {
      console.error('Test API key error:', error);
      return { valid: false, error: 'Failed to test API key' };
    }
  }
}

// Export singleton instance
export const openaiService = new OpenAIService();

// Initialize with environment variable if available
openaiService.initialize();

export default openaiService;