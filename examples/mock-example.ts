import { MockGrokAPI } from '../src/mockGrokApi';

async function main() {
  try {
    console.log('🚀 Starting Mock Grok API Example');
    console.log('Make sure to run the mock server first: npm run mock-server');
    console.log('');
    
    // Initialize the Mock Grok API
    const mockGrokApi = new MockGrokAPI('http://localhost:3001', true);
    
    // Check if mock server is running
    const isServerRunning = await mockGrokApi.checkMockServer();
    if (!isServerRunning) {
      console.error('❌ Mock server is not running!');
      console.log('Please run: npm run mock-server');
      process.exit(1);
    }
    
    console.log('✅ Mock server is running');
    console.log('');
    
    // Example 1: Send a message to create a new conversation
    console.log('📝 Example 1: Creating new conversation');
    console.log('Sending message: "What are the three laws of robotics?"');
    const response1 = await mockGrokApi.sendMessage({
      message: "What are the three laws of robotics?",
    });
    
    console.log('\n🤖 Mock Grok Response:');
    console.log('----------------------------------------');
    console.log(response1.fullMessage);
    console.log('----------------------------------------');
    
    if (response1.metadata?.followUpSuggestions) {
      console.log('\n💡 Follow-up suggestions:');
      response1.metadata.followUpSuggestions.forEach((suggestion, index) => {
        console.log(`${index + 1}. ${suggestion}`);
      });
    }
    
    // Example 2: Continue the conversation
    console.log('\n📝 Example 2: Continuing conversation');
    console.log('Sending follow-up: "Who created these laws?"');
    const response2 = await mockGrokApi.continueConversation(
      "Who created these laws?"
    );
    
    console.log('\n🤖 Mock Grok Follow-up Response:');
    console.log('----------------------------------------');
    console.log(response2.fullMessage);
    console.log('----------------------------------------');
    
    // Example 3: Streaming response
    console.log('\n📝 Example 3: Streaming response');
    console.log('Sending streaming message: "Tell me about space exploration"');
    console.log('\n🌊 Streaming response:');
    
    await mockGrokApi.sendMessageStream(
      {
        message: "Tell me about space exploration",
      },
      {
        onToken: (token: string) => {
          process.stdout.write(token);
        },
        onComplete: (response) => {
          console.log('\n\n✅ Streaming completed!');
          console.log(`Response ID: ${response.responseId}`);
          console.log(`Conversation ID: ${response.conversationId}`);
          
          if (response.metadata?.followUpSuggestions) {
            console.log('\n💡 Follow-up suggestions:');
            response.metadata.followUpSuggestions.forEach((suggestion, index) => {
              console.log(`${index + 1}. ${suggestion}`);
            });
          }
        },
        onError: (error) => {
          console.error('\n❌ Streaming error:', error);
        }
      }
    );
    
    // Example 4: Message with custom options
    console.log('\n📝 Example 4: Message with custom options');
    const response4 = await mockGrokApi.sendMessage({
      message: "Explain quantum computing",
      customInstructions: "Keep it simple and use analogies",
      forceConcise: true,
      disableSearch: true,
      enableImageGeneration: false
    });
    
    console.log('\n🤖 Mock Grok Response with Custom Options:');
    console.log('----------------------------------------');
    console.log(response4.fullMessage);
    console.log('----------------------------------------');
    
    // Show conversation info
    const conversationInfo = mockGrokApi.getConversationInfo();
    console.log('\n📊 Final Conversation Info:');
    console.log(`Conversation ID: ${conversationInfo.conversationId}`);
    console.log(`Last Response ID: ${conversationInfo.lastResponseId}`);
    
    console.log('\n🎉 Mock example completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();