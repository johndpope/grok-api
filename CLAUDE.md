# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript client library for interacting with Grok AI (`grok-api-ts`). The library provides automated login functionality, cookie management, and comprehensive interaction with Grok's API including streaming responses.

## Common Commands

**Build the project:**
```bash
npm run build
# or
pnpm run build
```

**Development (run with ts-node):**
```bash
npm run dev
# or
pnpm run dev
```

**Clean build artifacts:**
```bash
npm run clean
# or
pnpm run clean
```

**Run example:**
```bash
npm run example
# or
pnpm run example
```

**Prepare for publishing:**
```bash
npm run prepublishOnly
# or
pnpm run prepublishOnly
```

## Architecture

### Core Components

- **`src/grokApi.ts`**: Main GrokAPI class containing all functionality
- **`src/index.ts`**: Entry point that exports the GrokAPI class and types
- **`examples/`**: Example usage files showing different API patterns

### Key Features

1. **Authentication System**: Uses patchright (patched Playwright) to automate browser-based login to X.AI
2. **Cookie Management**: Persistent cookie storage in `grok-cookies.json` to avoid repeated logins
3. **Streaming Support**: Real-time response streaming with token-by-token callbacks
4. **Conversation Management**: Maintains conversation state and supports follow-up messages

### Main API Methods

- `login(username, password)`: Automated browser login
- `sendMessage(options)`: Send message to Grok with customizable options
- `continueConversation(message)`: Continue existing conversation
- `sendMessageStream(options, callbacks)`: Streaming version with real-time callbacks
- `ensureAuthenticated()`: Checks/handles authentication state

### Key Data Structures

- `GrokSendMessageOptions`: Message configuration including search, image generation, custom instructions
- `ParsedGrokResponse`: Parsed response containing message, metadata, and conversation info
- `GrokStreamCallbacks`: Streaming callbacks for tokens, completion, and errors

## Dependencies

- **Runtime**: `got-scraping`, `patchright`, `tough-cookie`
- **Development**: TypeScript, ts-node, rimraf, puppeteer
- **Peer**: `chrome-launcher` (optional)

## Testing

Currently no test suite is configured (`"test": "echo \"No tests yet\"`). When implementing tests, consider testing:
- Authentication flow
- Message sending/receiving
- Cookie persistence
- Error handling
- Streaming functionality

## File Structure

- `src/`: TypeScript source files
- `dist/`: Compiled JavaScript output
- `examples/`: Usage examples
- `node_modules/`: Dependencies
- `.chrome-data/`: Browser profile data for authentication

## Important Notes

- Chrome browser is required for authentication (uses patchright)
- Cookies are stored in `grok-cookies.json` for persistence
- The library targets Node.js 14+ with ES2020
- Uses CommonJS modules for compatibility
- Includes TypeScript declarations for full type safety