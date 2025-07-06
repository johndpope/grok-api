import express from 'express';
import cors from 'cors';
import { Request, Response } from 'express';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock conversation storage
const conversations = new Map<string, any>();
let conversationCounter = 1;
let responseCounter = 1;

// Mock responses pool
const mockResponses = [
  "I'm a mock Grok AI assistant. I can help you with various questions and tasks. What would you like to know?",
  "That's an interesting question! As a mock assistant, I'm designed to simulate responses to help with development and testing.",
  "I understand you're looking for information on that topic. While I'm just a mock endpoint, I can provide simulated responses.",
  "Thanks for your question! This is a simulated response from the mock Grok backend.",
  "I'm here to help! This mock server is designed to simulate the real Grok API for development purposes."
];

// Generate mock streaming response
function generateStreamingResponse(message: string): string[] {
  const baseResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
  const customResponse = `You asked: "${message}". ${baseResponse}`;
  
  // Split into chunks for streaming simulation
  const words = customResponse.split(' ');
  const chunks: string[] = [];
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (i === words.length - 1) {
      chunks.push(word);
    } else {
      chunks.push(word + ' ');
    }
  }
  
  return chunks;
}

// Mock endpoint for new conversations
app.post('/rest/app-chat/conversations/new', (req: Request, res: Response) => {
  const { message, modelName = 'grok-3', temporary = false } = req.body;
  
  const conversationId = `conv_${conversationCounter++}`;
  const responseId = `resp_${responseCounter++}`;
  const userResponseId = `user_${responseCounter++}`;
  
  console.log(`Mock: New conversation ${conversationId} - Message: "${message}"`);
  
  // Store conversation
  conversations.set(conversationId, {
    id: conversationId,
    title: `Mock Conversation ${conversationCounter - 1}`,
    messages: [
      { id: userResponseId, message, sender: 'user', timestamp: new Date().toISOString() }
    ]
  });
  
  const chunks = generateStreamingResponse(message);
  
  // Send response as streaming JSON lines
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Transfer-Encoding': 'chunked',
    'Access-Control-Allow-Origin': '*'
  });
  
  // First, send conversation creation
  res.write(JSON.stringify({
    result: {
      conversation: {
        conversationId,
        title: `Mock Conversation ${conversationCounter - 1}`,
        starred: false,
        createTime: new Date().toISOString(),
        modifyTime: new Date().toISOString(),
        systemPromptName: "default",
        temporary: false,
        mediaTypes: []
      }
    }
  }) + '\n');
  
  // Send user response confirmation
  res.write(JSON.stringify({
    result: {
      userResponse: {
        responseId: userResponseId,
        message,
        sender: "user",
        createTime: new Date().toISOString(),
        parentResponseId: "",
        manual: true,
        partial: false,
        shared: false,
        query: message,
        queryType: "text"
      }
    }
  }) + '\n');
  
  // Stream response tokens
  let tokenIndex = 0;
  const streamTokens = () => {
    if (tokenIndex < chunks.length) {
      const isLast = tokenIndex === chunks.length - 1;
      
      res.write(JSON.stringify({
        result: {
          response: {
            token: chunks[tokenIndex],
            isThinking: false,
            isSoftStop: false,
            responseId: responseId
          }
        }
      }) + '\n');
      
      tokenIndex++;
      
      if (isLast) {
        // Send final metadata
        setTimeout(() => {
          res.write(JSON.stringify({
            result: {
              response: {
                finalMetadata: {
                  followUpSuggestions: [
                    "Can you tell me more about this topic?",
                    "What are the key points I should remember?",
                    "How does this relate to other concepts?"
                  ],
                  feedbackLabels: ["helpful", "accurate", "clear"],
                  toolsUsed: {}
                },
                modelResponse: {
                  responseId: responseId,
                  message: chunks.join(''),
                  sender: "assistant",
                  createTime: new Date().toISOString(),
                  parentResponseId: userResponseId,
                  manual: false,
                  partial: false,
                  shared: false,
                  query: message,
                  queryType: "text",
                  webSearchResults: [],
                  xpostIds: [],
                  xposts: [],
                  generatedImageUrls: [],
                  imageAttachments: [],
                  fileAttachments: [],
                  cardAttachmentsJson: [],
                  fileUris: [],
                  fileAttachmentsMetadata: [],
                  isControl: false,
                  steps: [],
                  mediaTypes: []
                }
              }
            }
          }) + '\n');
          
          // Send title update
          res.write(JSON.stringify({
            result: {
              title: {
                newTitle: `Mock: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`
              }
            }
          }) + '\n');
          
          res.end();
        }, 100);
      } else {
        setTimeout(streamTokens, 50 + Math.random() * 100); // Simulate realistic timing
      }
    }
  };
  
  setTimeout(streamTokens, 200); // Initial delay
});

// Mock endpoint for continuing conversations
app.post('/rest/app-chat/conversations/:conversationId/responses', (req: Request, res: Response) => {
  const { conversationId } = req.params;
  const { message, parentResponseId } = req.body;
  
  console.log(`Mock: Continue conversation ${conversationId} - Message: "${message}"`);
  
  const responseId = `resp_${responseCounter++}`;
  const userResponseId = `user_${responseCounter++}`;
  
  const chunks = generateStreamingResponse(message);
  
  // Send response as streaming JSON lines
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Transfer-Encoding': 'chunked',
    'Access-Control-Allow-Origin': '*'
  });
  
  // Send user response confirmation
  res.write(JSON.stringify({
    result: {
      userResponse: {
        responseId: userResponseId,
        message,
        sender: "user",
        createTime: new Date().toISOString(),
        parentResponseId: parentResponseId || "",
        manual: true,
        partial: false,
        shared: false,
        query: message,
        queryType: "text"
      }
    }
  }) + '\n');
  
  // Stream response tokens
  let tokenIndex = 0;
  const streamTokens = () => {
    if (tokenIndex < chunks.length) {
      const isLast = tokenIndex === chunks.length - 1;
      
      res.write(JSON.stringify({
        result: {
          response: {
            token: chunks[tokenIndex],
            isThinking: false,
            isSoftStop: false,
            responseId: responseId
          }
        }
      }) + '\n');
      
      tokenIndex++;
      
      if (isLast) {
        // Send final metadata
        setTimeout(() => {
          res.write(JSON.stringify({
            result: {
              response: {
                finalMetadata: {
                  followUpSuggestions: [
                    "What else would you like to know?",
                    "Can you elaborate on that?",
                    "Are there any related topics?"
                  ],
                  feedbackLabels: ["helpful", "accurate", "clear"],
                  toolsUsed: {}
                },
                modelResponse: {
                  responseId: responseId,
                  message: chunks.join(''),
                  sender: "assistant",
                  createTime: new Date().toISOString(),
                  parentResponseId: userResponseId,
                  manual: false,
                  partial: false,
                  shared: false,
                  query: message,
                  queryType: "text",
                  webSearchResults: [],
                  xpostIds: [],
                  xposts: [],
                  generatedImageUrls: [],
                  imageAttachments: [],
                  fileAttachments: [],
                  cardAttachmentsJson: [],
                  fileUris: [],
                  fileAttachmentsMetadata: [],
                  isControl: false,
                  steps: [],
                  mediaTypes: []
                }
              }
            }
          }) + '\n');
          
          res.end();
        }, 100);
      } else {
        setTimeout(streamTokens, 50 + Math.random() * 100);
      }
    }
  };
  
  setTimeout(streamTokens, 200);
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Mock Grok API server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Mock Grok API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log('Endpoints:');
  console.log(`  POST http://localhost:${PORT}/rest/app-chat/conversations/new`);
  console.log(`  POST http://localhost:${PORT}/rest/app-chat/conversations/:id/responses`);
});

export default app;