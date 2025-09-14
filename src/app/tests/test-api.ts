/**
 * Simple test script to verify the streaming chat API
 * 
 * REQUIRED:
 * 1. Set CEREBRAS_API_KEY in your .env.local file
 * 2. Start the Next.js development server: npm run dev
 * 
 * OPTIONAL Environment Variables:
 * - TEST_MESSAGE: Custom test message (default: description of Mark Zuckerberg)
 * - TEST_TEMPERATURE: Temperature for AI responses (default: 0)
 * - TEST_MAX_TOKENS: Maximum tokens to generate (default: 1000, omit for unlimited)
 * - CEREBRAS_MODEL: Model to use (default: gpt-oss-120b)
 * - NEXT_PUBLIC_API_URL: API base URL (default: http://localhost:3000)
 * 
 * Usage:
 * npx tsx .\src\app\tests\test-api.ts
 */


const CHAT_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/chat';

// Configuration from environment variables
const TEST_CONFIG = {
  message: process.env.TEST_MESSAGE || 'Give a brief description of mark zuckerberg, and how he founded facebook.',
  temperature: parseFloat(process.env.TEST_TEMPERATURE || '0'),
  maxTokens: parseInt(process.env.TEST_MAX_TOKENS || '1000'),
};

type TestChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

type ChatChunk = {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    delta?: { content?: string };
    finish_reason?: string | null;
  }>;
  error?: { message: string };
};

async function testAPI(): Promise<void> {
  console.log('🧪 Testing Cerebras Chat API...\n');

  try {
    // Test 1: Basic streaming request
    console.log('📡 Sending streaming chat request...');
    
    const response = await fetch(CHAT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: TEST_CONFIG.message
          }
        ] as TestChatMessage[],
        model: process.env.CEREBRAS_MODEL || 'gpt-oss-120b',
        ...(process.env.TEST_MAX_TOKENS && { max_tokens: TEST_CONFIG.maxTokens }),
        temperature: TEST_CONFIG.temperature,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    if (!response.body) {
      throw new Error('No response body received from API');
    }

    console.log('✅ Request successful, streaming response...\n');
    console.log(`🔧 Config: Model=${process.env.CEREBRAS_MODEL || 'gpt-oss-120b'}, MaxTokens=${process.env.TEST_MAX_TOKENS ? TEST_CONFIG.maxTokens : 'default'}, Temp=${TEST_CONFIG.temperature}`);
    console.log('📝 Response:');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        console.log('\n✅ Stream completed successfully!');
        break;
      }

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            console.log('\n🏁 Stream finished');
            console.log('\n📊 Full response:', fullResponse);
            return;
          }

          try {
            const parsed: ChatChunk = JSON.parse(data);
            
            if (parsed.error) {
              console.error('\n❌ API Error:', parsed.error.message);
              return;
            }
            
            // Handle all chunk types (content, role, finish_reason, etc.)
            if (parsed.choices && parsed.choices[0]) {
              const choice = parsed.choices[0];
              
              // Stream content
              if (choice.delta?.content) {
                const content = choice.delta.content;
                process.stdout.write(content);
                fullResponse += content;
              }
              
              // Handle finish reason
              if (choice.finish_reason) {
                console.log(`\n🏁 Finished: ${choice.finish_reason}`);
              }
            }
          } catch (e) {
            // Skip malformed JSON
          }
        }
      }
    }

  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('❌ Test failed:', error.message);

      if (error.message.includes('ECONNREFUSED')) {
        console.log('\n💡 Make sure the Next.js development server is running:');
        console.log('   npm run dev');
      }

      if (error.message.includes('CEREBRAS_API_KEY')) {
        console.log('\n💡 Make sure to set your Cerebras API key in .env.local:');
        console.log('   CEREBRAS_API_KEY=your_api_key_here');
      }
    } else {
      console.error('❌ Test failed with unknown error:', error);
    }
  }
}

// Run the test
testAPI();
