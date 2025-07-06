# Mock Grok API Server

This project includes a mock server that simulates the Grok API endpoints for development and testing purposes. The mock server eliminates the need for authentication and provides realistic streaming responses.

## Quick Start

1. **Install dependencies:**
```bash
npm install
# or
pnpm install
```

2. **Start the mock server:**
```bash
npm run mock-server
# or
pnpm run mock-server
```

3. **Run the mock example:**
```bash
# In another terminal
npm run mock-example
# or
pnpm run mock-example
```

## Mock Server Features

- **No Authentication Required**: Skip the complex browser-based login process
- **Realistic Streaming**: Simulates token-by-token response streaming
- **Conversation Management**: Maintains conversation state like the real API
- **Follow-up Suggestions**: Provides mock follow-up suggestions
- **Error Handling**: Proper error responses and status codes
- **CORS Support**: Configured for cross-origin requests

## Usage

### Using MockGrokAPI Class

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

### Direct API Calls

You can also make direct HTTP requests to the mock server:

```bash
# New conversation
curl -X POST http://localhost:3001/rest/app-chat/conversations/new \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!", "modelName": "grok-3"}'

# Continue conversation
curl -X POST http://localhost:3001/rest/app-chat/conversations/conv_1/responses \
  -H "Content-Type: application/json" \
  -d '{"message": "Follow up", "parentResponseId": "resp_1"}'

# Health check
curl http://localhost:3001/health
```

## Mock Server Endpoints

- `POST /rest/app-chat/conversations/new` - Create new conversation
- `POST /rest/app-chat/conversations/:id/responses` - Continue conversation
- `GET /health` - Health check endpoint

## Configuration

The mock server runs on port 3001 by default. You can customize the port:

```bash
PORT=3002 npm run mock-server
```

When using MockGrokAPI, specify the custom URL:

```typescript
const mockGrokApi = new MockGrokAPI('http://localhost:3002', true);
```

## Mock Response Format

The mock server returns responses in the same format as the real Grok API:

```json
{
  "result": {
    "conversation": {
      "conversationId": "conv_1",
      "title": "Mock Conversation 1"
    },
    "response": {
      "token": "Hello ",
      "responseId": "resp_1"
    },
    "finalMetadata": {
      "followUpSuggestions": ["Follow up 1", "Follow up 2"],
      "feedbackLabels": ["helpful", "accurate"]
    }
  }
}
```

## Development Benefits

1. **Faster Development**: No need to wait for real API authentication
2. **Offline Testing**: Work without internet connection
3. **Predictable Responses**: Consistent mock responses for testing
4. **Rate Limit Free**: No API rate limits during development
5. **Easy Debugging**: Full control over response timing and content

## Switching Between Real and Mock APIs

```typescript
// For development/testing
const grokApi = new MockGrokAPI('http://localhost:3001', true);

// For production
const grokApi = new GrokAPI();
await grokApi.login('username', 'password');
```

## Custom Mock Responses

You can modify `mock-server/server.ts` to customize:

- Response content and variety
- Streaming timing and behavior
- Error simulation
- Follow-up suggestions
- Conversation titles

## Troubleshooting

**Mock server won't start:**
- Check if port 3001 is available
- Install dependencies: `npm install`
- Check for TypeScript compilation errors

**Connection refused errors:**
- Ensure mock server is running: `npm run mock-server`
- Verify the correct port and URL
- Check firewall settings

**Streaming not working:**
- Ensure you're using the streaming methods correctly
- Check console for error messages
- Verify callback functions are properly defined