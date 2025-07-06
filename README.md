# Unofficial Grok API Client

A TypeScript client for interacting with Grok AI. This client provides automated login functionality, cookie management, and comprehensive interaction with Grok's API.

## Features

- Automated browser-based login to Grok via X.AI auth
- Cookie persistence to avoid repeated logins
- Automatic handling of expired cookies
- Send messages to Grok with customizable options
- Continue conversations with follow-up messages
- Support for image attachments
- Customizable search settings and image generation
- Support for custom instructions and reasoning mode
- Conversation management

## Installation

```bash
# Using npm
npm install grok-api-ts

# Using pnpm
pnpm add grok-api-ts

# Using yarn
yarn add grok-api-ts
```

## Usage

### Basic Usage

```typescript
import GrokAPI from 'grok-api-ts';
// Or use named import
// import { GrokAPI } from 'grok-api-ts';

async function main() {
  // Initialize the Grok API (will prompt for login if needed)
  const grokApi = new GrokAPI();
  
  // If not authenticated, you'll need to login
  if (!grokApi.isAuthenticated()) {
    await grokApi.login('your-email@example.com', 'your-password');
  }
  
  // Start a new conversation
  const response = await grokApi.sendMessage({
    message: "What are the three laws of robotics?",
  });
  
  console.log(response.fullMessage);
  
  // Continue the conversation
  const followUp = await grokApi.continueConversation(
    "Who created these laws and in what book did they first appear?"
  );
  
  console.log(followUp.fullMessage);
}

main();
```

### Automated Login Process

The client handles authentication automatically:

1. First, it checks for existing cookies stored in `grok-cookies.json`
2. If valid cookies are found, they will be used for API requests
3. If no cookies are found, you'll need to call `login(username, password)` method
4. During login, a real browser will open to complete the authentication via X.AI's auth system
5. After successful login, cookies are saved for future use
6. If cookies expire during usage, the client will detect auth failures and prompt for re-login

### Advanced Usage: Custom Options

```typescript
import GrokAPI from 'grok-api-ts';

async function main() {
  const grokApi = new GrokAPI();
  
  // Ensure authenticated
  await grokApi.ensureAuthenticated('your-email@example.com', 'your-password');
  
  // Start a new conversation with custom options
  const response = await grokApi.sendMessage({
    message: "Explain the concept of quantum computing",
    disableSearch: false,           // Enable web search (default)
    enableImageGeneration: true,    // Allow Grok to generate images (default)
    customInstructions: "Explain in simple terms with analogies",
    forceConcise: true              // Request a more concise response
  });
  
  console.log(response.fullMessage);
  
  // Access response metadata
  if (response.metadata?.followUpSuggestions) {
    console.log("Follow-up suggestions:", response.metadata.followUpSuggestions);
  }
  
  // Access conversation information
  const { conversationId, lastResponseId } = grokApi.getConversationInfo();
  console.log(`Conversation ID: ${conversationId}`);
}

main();
```

### Streaming Responses

The client supports streaming responses, allowing you to process Grok's response as it's being generated:

```typescript
import GrokAPI from 'grok-api-ts';

async function main() {
  const grokApi = new GrokAPI();
  await grokApi.ensureAuthenticated();

  // Use streaming API with callbacks
  await grokApi.sendMessageStream(
    {
      message: "Write a story about a space adventure",
    },
    {
      // Called for each token of the response
      onToken: (token: string) => {
        process.stdout.write(token);
      },
      // Called when the response is complete with full response data
      onComplete: (response: ParsedGrokResponse) => {
        console.log("\nResponse completed!");
        console.log("Follow-up suggestions:", response.metadata?.followUpSuggestions);
      },
      // Called if an error occurs during streaming
      onError: (error: any) => {
        console.error("Error during streaming:", error);
      }
    }
  );
}

main();
```

### Handling Authentication Errors

The client automatically handles authentication errors:

```typescript
import GrokAPI from 'grok-api-ts';

async function main() {
  const grokApi = new GrokAPI();
  
  try {
    // Try making a request
    const response = await grokApi.sendMessage({
      message: "Hello Grok!"
    });
    console.log(response.fullMessage);
  } catch (error) {
    // If authentication failed, login and retry
    console.log("Authentication error, attempting login...");
    const loginSuccess = await grokApi.login('your-email@example.com', 'your-password');
    
    if (loginSuccess) {
      // Retry the request after successful login
      const response = await grokApi.sendMessage({
        message: "Hello Grok!"
      });
      console.log(response.fullMessage);
    }
  }
}

main();
```

### Customizing Cookie Storage Location

You can specify a custom location for cookie storage:

```typescript
const grokApi = new GrokAPI([], '/path/to/your/cookies.json');
```

### Using with TypeScript

All types are exported for TypeScript users:

```typescript
import GrokAPI, { 
  GrokSendMessageOptions, 
  ParsedGrokResponse, 
  GrokModelResponse 
} from 'grok-api-ts';

// Use types in your code
const options: GrokSendMessageOptions = {
  message: "Hello Grok!",
  disableSearch: true
};

// Type safety for function returns
const handleResponse = (response: ParsedGrokResponse) => {
  console.log(response.fullMessage);
};
```

## API Reference

### `GrokAPI` Class

#### Constructor

```typescript
constructor(cookieStrings?: string[], cookiesPath?: string)
```

- `cookieStrings`: Optional array of cookie strings
- `cookiesPath`: Optional path to the cookies file (defaults to `grok-cookies.json`)

#### Methods

- `async login(username: string, password: string): Promise<boolean>`
  Automates the login process using a real browser and returns success status.

- `isAuthenticated(): boolean`
  Checks if the client has valid authentication cookies.

- `async ensureAuthenticated(username?: string, password?: string): Promise<boolean>`
  Ensures the client is authenticated, triggering login if needed.

- `async sendMessage(options: GrokSendMessageOptions): Promise<ParsedGrokResponse>`
  Sends a message to Grok and returns the response.
  
  Options include:
  - `message`: The message text to send
  - `disableSearch`: Whether to disable web search capability (default: false)
  - `enableImageGeneration`: Whether to allow Grok to generate images (default: true)
  - `customInstructions`: Custom instructions to guide Grok's response
  - `forceConcise`: Request a more concise response (default: false)
  - `imageAttachments`: Array of image attachments
  - `conversationId`: ID of the conversation (defaults to 'new')
  - `parentResponseId`: ID of the parent response for threading
  - `isReasoning`: Enable reasoning mode (default: false)

- `async continueConversation(message: string, options?: Omit<GrokSendMessageOptions, 'message'>): Promise<ParsedGrokResponse>`
  Continues an existing conversation with a follow-up message.

- `getConversationInfo(): { conversationId: string; lastResponseId: string }`
  Returns information about the current conversation.

### Response Types

The `ParsedGrokResponse` includes:

- `fullMessage`: The complete text response from Grok
- `responseId`: Unique ID for the response (for continuing the conversation)
- `title`: Conversation title (for new conversations)
- `metadata`: Additional metadata including follow-up suggestions
- `modelResponse`: Detailed model response object
- `conversationId`: ID of the conversation

## Mock Server for Development

This library includes a comprehensive mock server that simulates the Grok API endpoints without requiring authentication. This is perfect for development, testing, and integration work.

### Quick Start with Mock Server

1. **Start the mock server:**
   ```bash
   npm run mock-server
   # or
   pnpm run mock-server
   ```

2. **Use the MockGrokAPI class:**
   ```typescript
   import { MockGrokAPI } from 'grok-api-ts';

   const mockGrokApi = new MockGrokAPI('http://localhost:3001', true);

   // Check if mock server is running
   const isRunning = await mockGrokApi.checkMockServer();

   // Send message (no authentication needed)
   const response = await mockGrokApi.sendMessage({
     message: "Hello, mock Grok!"
   });

   console.log(response.fullMessage);
   ```

3. **Run the included mock example:**
   ```bash
   npm run mock-example
   # or
   pnpm run mock-example
   ```

### Mock Server Features

- **No Authentication Required**: Skip complex browser-based login
- **Realistic Streaming**: Token-by-token response streaming simulation
- **Conversation Management**: Maintains conversation state
- **Image Generation Support**: Simulates image generation with progress tracking
- **File Upload Support**: Mock file attachment handling
- **Follow-up Suggestions**: Dynamic conversation prompts
- **Error Handling**: Proper error responses and status codes
- **CORS Support**: Configured for cross-origin requests

### Mock Server Endpoints

- `POST /rest/app-chat/conversations/new` - Create new conversation
- `POST /rest/app-chat/conversations/:id/responses` - Continue conversation
- `POST /rest/app-chat/upload-file` - Upload file attachments
- `GET /health` - Health check endpoint

### Switching Between Real and Mock APIs

```typescript
// For development/testing
const mockGrokApi = new MockGrokAPI('http://localhost:3001', true);

// For production
const realGrokApi = new GrokAPI();
await realGrokApi.login('username', 'password');

// Use the same interface for both
const response = await grokApi.sendMessage({
  message: "Hello Grok!"
});
```

## Grok API Response Formats

The library handles multiple response formats from the Grok API:

### Standard Text Response

```typescript
{
  fullMessage: string;           // Complete response text
  responseId: string;            // Unique response identifier
  title?: string;                // Conversation title
  conversationId?: string;       // Conversation identifier
  metadata?: {
    followUpSuggestions: string[];      // Suggested follow-up questions
    feedbackLabels: string[];           // Available feedback options
    toolsUsed: object;                  // Tools used in response
  };
  modelResponse?: {
    message: string;                    // Response text
    webSearchResults?: Array<{          // Web search results (if enabled)
      title: string;
      url: string;
      snippet: string;
    }>;
    generatedImageUrls?: string[];      // Generated image URLs
    imageAttachments?: any[];           // Image attachments
    fileAttachments?: any[];            // File attachments
    // ... additional metadata
  };
}
```

### Streaming Response Format

When using streaming, the response is built incrementally:

```typescript
// Token-by-token streaming
onToken: (token: string) => void;

// Complete response when finished
onComplete: (response: ParsedGrokResponse) => void;

// Error handling
onError: (error: any) => void;
```

### Image Generation Response

When image generation is enabled:

```typescript
{
  fullMessage: "I generated images with the prompt: '...'";
  modelResponse: {
    generatedImageUrls: [
      "https://example.com/generated-image.jpg"
    ];
    // ... other properties
  };
  metadata: {
    followUpSuggestions: [
      { 
        properties: { messageType: "IMAGE_GEN", followUpType: "STYLE" },
        label: "artistic atmosphere"
      }
      // ... more suggestions
    ];
  };
}
```

### Error Response Format

```typescript
{
  error: string;                 // Error message
  statusCode?: number;           // HTTP status code
  details?: any;                 // Additional error details
}
```

## Configuration Options

### GrokSendMessageOptions

```typescript
interface GrokSendMessageOptions {
  message: string;                    // Required: The message to send
  conversationId?: string;            // Conversation ID ('new' for new conversation)
  parentResponseId?: string;          // Parent response ID for threading
  disableSearch?: boolean;            // Disable web search (default: false)
  enableImageGeneration?: boolean;    // Enable image generation (default: true)
  customInstructions?: string;        // Custom instructions for the response
  forceConcise?: boolean;             // Request concise response (default: false)
  imageAttachments?: any[];           // Image attachments
  isReasoning?: boolean;              // Enable reasoning mode (default: false)
}
```

### MockGrokAPI Constructor

```typescript
constructor(
  mockBaseUrl: string = 'http://localhost:3001',  // Mock server URL
  skipAuth: boolean = true                        // Skip authentication
)
```

## Development Benefits

1. **Faster Development**: No authentication delays
2. **Offline Testing**: Work without internet connection
3. **Predictable Responses**: Consistent mock responses for testing
4. **Rate Limit Free**: No API rate limits during development
5. **Easy Debugging**: Full control over response timing and content
6. **Image Generation Testing**: Simulate image generation workflows
7. **File Upload Testing**: Test file attachment handling

## Requirements

- Node.js 14+
- Chrome browser installed (used by patchright for authentication) - *Not required for mock server*

## License

MIT 
