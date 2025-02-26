import GrokAPI, { GrokSendMessageOptions } from '../src/index';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  try {
    // Initialize the GrokAPI with custom cookies path
    const grokApi = new GrokAPI([], path.join(__dirname, 'custom-cookies.json'));
    
    // Function to handle authentication
    const ensureAuth = async () => {
      if (!grokApi.isAuthenticated()) {
        console.log('Authentication needed. Starting login...');
        // Replace with your credentials
        return await grokApi.login('your-email@example.com', 'your-password');
      }
      return true;
    };
    
    // Ensure we're authenticated
    if (!await ensureAuth()) {
      console.error('Failed to authenticate');
      return;
    }
    
    // Example 1: Custom options for more customized response
    console.log('\n--- Example 1: Using Custom Options ---');
    const customOptions: GrokSendMessageOptions = {
      message: "Explain quantum computing to a 10-year old",
      disableSearch: true,            // Don't use web search
      enableImageGeneration: true,    // Let Grok generate images if it wants
      customInstructions: "Be very playful and use analogies a child would understand",
      forceConcise: true              // Keep it brief
    };
    
    try {
      const customResponse = await grokApi.sendMessage(customOptions);
      console.log('\nGrok Response with Custom Options:');
      console.log('----------------------------------------');
      console.log(customResponse.fullMessage);
      console.log('----------------------------------------');
      
      // Show any follow-up suggestions
      if (customResponse.metadata?.followUpSuggestions?.length) {
        console.log('\nSuggested follow-up questions:');
        customResponse.metadata.followUpSuggestions.forEach((suggestion, i) => {
          console.log(`${i+1}. ${suggestion}`);
        });
      }
      
      // Get conversation info
      const convInfo = grokApi.getConversationInfo();
      console.log(`\nConversation ID: ${convInfo.conversationId}`);
      console.log(`Last Response ID: ${convInfo.lastResponseId}`);
    } catch (error) {
      console.error('Error with custom options example:', error);
      // Re-authenticate if needed
      await ensureAuth();
    }
    
    // Example 2: Error handling and retry pattern
    console.log('\n--- Example 2: Error Handling and Retry Pattern ---');
    const maxRetries = 2;
    let retryCount = 0;
    
    const sendWithRetry = async (message: string) => {
      while (retryCount <= maxRetries) {
        try {
          return await grokApi.sendMessage({ message });
        } catch (error: any) {
          console.error(`Error (attempt ${retryCount + 1}/${maxRetries + 1}):`, error.message);
          retryCount++;
          
          if (retryCount <= maxRetries) {
            console.log('Attempting to re-authenticate and retry...');
            await grokApi.login('your-email@example.com', 'your-password');
          } else {
            throw new Error('Max retries exceeded');
          }
        }
      }
    };
    
    try {
      const retryResponse = await sendWithRetry('What is the meaning of life?');
      if (retryResponse) {
        console.log('\nSuccessful response after retry pattern:');
        console.log('----------------------------------------');
        console.log(retryResponse.fullMessage);
        console.log('----------------------------------------');
      }
    } catch (error) {
      console.error('All retries failed:', error);
    }
    
  } catch (error) {
    console.error('Main error:', error);
  }
}

main(); 