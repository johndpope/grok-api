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

## Requirements

- Node.js 14+
- Chrome browser installed (used by patchright for authentication)

## License

MIT 
