import { GrokAPI, GrokSendMessageOptions, ParsedGrokResponse, GrokStreamCallbacks } from './grokApi';

export class BrowserMockGrokAPI extends GrokAPI {
  private mockBaseUrl: string;
  private skipAuth: boolean;

  constructor(mockBaseUrl: string = 'http://localhost:3001', skipAuth: boolean = true) {
    super([], ''); // Initialize with empty cookies
    this.mockBaseUrl = mockBaseUrl;
    this.skipAuth = skipAuth;
  }

  // Override authentication methods for mock
  isAuthenticated(): boolean {
    return this.skipAuth || super.isAuthenticated();
  }

  async ensureAuthenticated(): Promise<boolean> {
    if (this.skipAuth) {
      return true;
    }
    return super.ensureAuthenticated();
  }

  async login(username: string, password: string): Promise<boolean> {
    if (this.skipAuth) {
      console.log('Mock mode: Skipping authentication');
      return true;
    }
    return super.login(username, password);
  }

  async sendMessage(options: GrokSendMessageOptions): Promise<ParsedGrokResponse> {
    if (!this.skipAuth && !this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch(`${this.mockBaseUrl}/grok/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: options.message,
          customInstructions: options.customInstructions,
          conversationId: options.conversationId,
          disableSearch: options.disableSearch,
          enableImageGeneration: options.enableImageGeneration,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        fullMessage: data.response,
        responseId: data.responseId,
        title: data.title,
        metadata: data.metadata,
        modelResponse: data.modelResponse,
        conversationId: data.conversationId,
      };
    } catch (error) {
      console.error('Error sending message to mock Grok API:', error);
      throw error;
    }
  }

  async sendMessageStream(options: GrokSendMessageOptions, callbacks: GrokStreamCallbacks): Promise<void> {
    if (!this.skipAuth && !this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch(`${this.mockBaseUrl}/grok/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: options.message,
          customInstructions: options.customInstructions,
          conversationId: options.conversationId,
          disableSearch: options.disableSearch,
          enableImageGeneration: options.enableImageGeneration,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullMessage = '';

      if (!reader) {
        throw new Error('No response body reader available');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              callbacks.onComplete?.({
                fullMessage,
                responseId: undefined,
                title: undefined,
                metadata: undefined,
                modelResponse: undefined,
                conversationId: undefined,
              });
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.token) {
                fullMessage += parsed.token;
                callbacks.onToken?.(parsed.token);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in streaming message to mock Grok API:', error);
      callbacks.onError?.(error);
      throw error;
    }
  }

  async checkMockServer(): Promise<boolean> {
    try {
      const response = await fetch(`${this.mockBaseUrl}/health`);
      return response.ok;
    } catch (error) {
      console.error('Mock server check failed:', error);
      return false;
    }
  }
}