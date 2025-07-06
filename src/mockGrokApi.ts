import { GrokAPI, GrokSendMessageOptions, ParsedGrokResponse, GrokStreamCallbacks } from './grokApi';
import { gotScraping } from 'got-scraping';

export class MockGrokAPI extends GrokAPI {
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
      throw new Error('Authentication required: Please call login() method first or provide cookies');
    }
    
    try {
      const {
        message,
        conversationId = 'new',
        parentResponseId = '',
        disableSearch = false,
        enableImageGeneration = true,
        customInstructions = "",
        forceConcise = false,
        imageAttachments = [],
        isReasoning = false
      } = options;
      
      const isNewConversation = conversationId === 'new';
      const url = isNewConversation
        ? `${this.mockBaseUrl}/rest/app-chat/conversations/new`
        : `${this.mockBaseUrl}/rest/app-chat/conversations/${conversationId}/responses`;
      
      console.log(`Mock: Sending message to ${isNewConversation ? 'new conversation' : 'existing conversation'}: ${conversationId}`);
      
      const response = await gotScraping.post(url, {
        headers: {
          'accept': '*/*',
          'content-type': 'application/json',
        },
        json: {
          "temporary": false,
          "modelName": "grok-3",
          "message": message,
          "fileAttachments": [],
          "imageAttachments": imageAttachments,
          "disableSearch": disableSearch,
          "enableImageGeneration": enableImageGeneration,
          "returnImageBytes": false,
          "returnRawGrokInXaiRequest": false,
          "enableImageStreaming": true,
          "imageGenerationCount": 2,
          "forceConcise": forceConcise,
          "toolOverrides": {},
          "enableSideBySide": false,
          "sendFinalMetadata": true,
          "customInstructions": customInstructions,
          "deepsearchPreset": "",
          "isReasoning": isReasoning,
          ...(isNewConversation ? {} : { "parentResponseId": parentResponseId })
        }
      });
      
      const parsedResponse = this.parseGrokResponse(response.body);
      
      if (parsedResponse.conversationId) {
        (this as any).lastConversationId = parsedResponse.conversationId;
      }
      
      if (parsedResponse.responseId) {
        (this as any).lastResponseId = parsedResponse.responseId;
      }
      
      return parsedResponse;
    } catch (error: any) {
      console.error('Error sending message to Mock Grok:', error);
      throw error;
    }
  }

  async sendMessageStream(options: GrokSendMessageOptions, callbacks: GrokStreamCallbacks): Promise<void> {
    if (!this.skipAuth && !this.isAuthenticated()) {
      throw new Error('Authentication required: Please call login() method first or provide cookies');
    }
    
    try {
      const {
        message,
        conversationId = 'new',
        parentResponseId = '',
        disableSearch = false,
        enableImageGeneration = true,
        customInstructions = "",
        forceConcise = false,
        imageAttachments = [],
        isReasoning = false
      } = options;
      
      const isNewConversation = conversationId === 'new';
      const url = isNewConversation
        ? `${this.mockBaseUrl}/rest/app-chat/conversations/new`
        : `${this.mockBaseUrl}/rest/app-chat/conversations/${conversationId}/responses`;
      
      console.log(`Mock: Streaming message to ${isNewConversation ? 'new conversation' : 'existing conversation'}: ${conversationId}`);
      
      // Initialize accumulated response data
      let fullMessage = '';
      let responseId: string | undefined;
      let title: string | undefined;
      let metadata: any;
      let modelResponse: any;
      let conversationId_: string | undefined;
      let accumulator = '';
      
      // Create a stream request
      const stream = gotScraping.stream.post(url, {
        headers: {
          'accept': '*/*',
          'content-type': 'application/json',
        },
        json: {
          "temporary": false,
          "modelName": "grok-3",
          "message": message,
          "fileAttachments": [],
          "imageAttachments": imageAttachments,
          "disableSearch": disableSearch,
          "enableImageGeneration": enableImageGeneration,
          "returnImageBytes": false,
          "returnRawGrokInXaiRequest": false,
          "enableImageStreaming": true,
          "imageGenerationCount": 2,
          "forceConcise": forceConcise,
          "toolOverrides": {},
          "enableSideBySide": false,
          "sendFinalMetadata": true,
          "customInstructions": customInstructions,
          "deepsearchPreset": "",
          "isReasoning": isReasoning,
          ...(isNewConversation ? {} : { "parentResponseId": parentResponseId })
        }
      });
      
      // Process the stream data (same logic as parent class)
      stream.on('data', (chunk: Buffer) => {
        const chunkStr = chunk.toString();
        accumulator += chunkStr;
        
        // Process complete JSON lines
        let lineEnd = accumulator.indexOf('\n');
        while (lineEnd !== -1) {
          const line = accumulator.substring(0, lineEnd);
          accumulator = accumulator.substring(lineEnd + 1);
          
          try {
            if (line.trim()) {
              const parsedLine: any = JSON.parse(line);
              
              // Handle conversation ID
              if (parsedLine.result?.conversation?.conversationId) {
                conversationId_ = parsedLine.result.conversation.conversationId;
                console.log(`Mock: Found conversation ID: ${conversationId_}`);
              }
              
              // Handle token and send it via callback
              let token: string | undefined;
              
              if (parsedLine.result?.response?.token !== undefined) {
                token = parsedLine.result.response.token;
                responseId = parsedLine.result.response.responseId;
              } else if (parsedLine.result?.token !== undefined) {
                token = parsedLine.result.token || '';
                responseId = parsedLine.result.responseId;
              }
              
              if (token !== undefined) {
                fullMessage += token;
                if (callbacks.onToken) {
                  callbacks.onToken(token);
                }
              }
              
              // Handle metadata
              if (parsedLine.result?.response?.finalMetadata) {
                metadata = parsedLine.result.response.finalMetadata;
              } else if (parsedLine.result?.finalMetadata) {
                metadata = parsedLine.result.finalMetadata;
              }
              
              // Handle model response
              if (parsedLine.result?.response?.modelResponse) {
                modelResponse = parsedLine.result.response.modelResponse;
                responseId = modelResponse.responseId;
              } else if (parsedLine.result?.modelResponse) {
                modelResponse = parsedLine.result.modelResponse;
                responseId = modelResponse.responseId;
              }
              
              // Handle title
              if (parsedLine.result?.title) {
                title = parsedLine.result.title.newTitle;
              }
              
              // Handle user response
              if (parsedLine.result?.response?.userResponse?.responseId) {
                responseId = parsedLine.result.response.userResponse.responseId;
              } else if (parsedLine.result?.userResponse?.responseId) {
                responseId = parsedLine.result.userResponse.responseId;
              }
            }
          } catch (error) {
            console.error('Error parsing JSON line:', error);
          }
          
          lineEnd = accumulator.indexOf('\n');
        }
      });
      
      // Handle the completion of the stream
      stream.on('end', () => {
        // Use the model response message if we don't have a full message yet
        if (modelResponse?.message && !fullMessage) {
          fullMessage = modelResponse.message;
        }
        
        // Store the conversation ID and response ID
        if (conversationId_) {
          (this as any).lastConversationId = conversationId_;
        }
        
        if (responseId) {
          (this as any).lastResponseId = responseId;
        }
        
        // Create the final response object
        const parsedResponse: ParsedGrokResponse = {
          fullMessage,
          responseId,
          title,
          metadata,
          modelResponse,
          conversationId: conversationId_
        };
        
        // Call the onComplete callback
        if (callbacks.onComplete) {
          callbacks.onComplete(parsedResponse);
        }
      });
      
      // Handle errors
      stream.on('error', (error: any) => {
        console.error('Error streaming message from Mock Grok:', error);
        
        if (callbacks.onError) {
          callbacks.onError(error);
        }
      });
    } catch (error: any) {
      console.error('Error setting up streaming request to Mock Grok:', error);
      
      if (callbacks.onError) {
        callbacks.onError(error);
      }
    }
  }

  // Add a method to check if mock server is running
  async checkMockServer(): Promise<boolean> {
    try {
      const response = await gotScraping.get(`${this.mockBaseUrl}/health`);
      return response.statusCode === 200;
    } catch (error) {
      console.error('Mock server is not running. Start it with: npm run mock-server');
      return false;
    }
  }
}