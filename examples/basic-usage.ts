import GrokAPI from '../src/index';

async function main() {
  try {
    // Initialize the GrokAPI
    const grokApi = new GrokAPI();
    
    // Check if already authenticated
    if (!grokApi.isAuthenticated()) {
      console.log('Not authenticated. Starting login process...');
      // Fill in your own credentials here
      const success = await grokApi.login('your-email@example.com', 'your-password');
      
      if (!success) {
        console.error('Login failed');
        return;
      }
      console.log('Login successful');
    } else {
      console.log('Already authenticated');
    }
    
    // Send a message to Grok
    console.log('Sending message to Grok...');
    const response = await grokApi.sendMessage({
      message: "What are the three laws of robotics?",
    });
    
    console.log('\nGrok Response:');
    console.log('----------------------------------------');
    console.log(response.fullMessage);
    console.log('----------------------------------------');
    
    // Continue the conversation
    console.log('\nSending follow-up question...');
    const followUp = await grokApi.continueConversation(
      "Who created these laws and in what book did they first appear?"
    );
    
    console.log('\nGrok Follow-up Response:');
    console.log('----------------------------------------');
    console.log(followUp.fullMessage);
    console.log('----------------------------------------');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 