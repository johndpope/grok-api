import GrokAPI from '../src';

async function testStreaming() {
  const grokApi = new GrokAPI();

  try {
    console.log('Starting streaming test...\n');
    
    // Check authentication
    if (!grokApi.isAuthenticated()) {
      console.log('Not authenticated. Please enter your credentials:');
      // You'll need to replace these with your actual credentials
      const email = 'email@example.com';
      const password = '3vfvf@';
      
      if (!email || !password) {
        throw new Error('Please set GROK_EMAIL and GROK_PASSWORD environment variables');
      }

      console.log('Logging in...');
      await grokApi.login(email, password);
      console.log('Login successful!\n');
    }
    
    await grokApi.sendMessageStream(
      {
        message: "Write a short story about an AI that learns to feel emotions. Keep it under 200 words.",
      },
      {
        onToken: (token: string) => {
          // Print each token as it comes in
          process.stdout.write(token);
        },
        onComplete: (response) => {
          console.log('\n\n=== Response Complete ===');
          if (response.metadata?.followUpSuggestions) {
            console.log('\nFollow-up suggestions:');
            response.metadata.followUpSuggestions.forEach((suggestion, i) => {
              console.log(`${i + 1}. ${suggestion}`);
            });
          }
        },
        onError: (error) => {
          console.error('\nError during streaming:', error);
        }
      }
    );
  } catch (error) {
    console.error('Failed to send message:', error);
  }
}

// Run the test
testStreaming().catch(console.error);
