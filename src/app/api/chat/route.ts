import { NextRequest } from 'next/server';
import Cerebras from '@cerebras/cerebras_cloud_sdk';

// Initialize the Cerebras client
const client = new Cerebras({
  apiKey: process.env.CEREBRAS_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, model = process.env.CEREBRAS_MODEL || 'gpt-oss-120b', stream: shouldStream = process.env.STREAM || true, ...otherParams } = body;

    // Validate required fields
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required and must not be empty' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate API key
    if (!process.env.CEREBRAS_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'CEREBRAS_API_KEY environment variable is not set' }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create streaming response
    const encoder = new TextEncoder();
    
    const responseStream = new ReadableStream({
      async start(controller) {
        try {
          // Create the chat completion stream
          const cerebrasStream = await client.chat.completions.create({
            messages,
            model,
            stream: shouldStream,
            ...otherParams, // This already includes max_tokens only if provided by client
          }) as any;

          // Process each chunk from the stream
          for await (const chunk of cerebrasStream) {
            const content = chunk.choices[0]?.delta?.content || '';
            
            // Always send the chunk, even if content is empty (for metadata)
            const data = `data: ${JSON.stringify({
              id: chunk.id,
              object: chunk.object,
              created: chunk.created,
              model: chunk.model,
              choices: chunk.choices,
            })}\n\n`;
            
            controller.enqueue(encoder.encode(data));
          }

          // Send completion signal
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
          
        } catch (error) {
          console.error('Streaming error:', error);
          
          // Send error as SSE
          const errorData = `data: ${JSON.stringify({
            error: {
              message: error instanceof Error ? error.message : 'An error occurred',
              type: 'server_error',
            }
          })}\n\n`;
          
          controller.enqueue(encoder.encode(errorData));
          controller.close();
        }
      },
    });

    return new Response(responseStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
        'Access-Control-Allow-Methods': process.env.CORS_METHODS || 'POST, OPTIONS',
        'Access-Control-Allow-Headers': process.env.CORS_HEADERS || 'Content-Type',
      },
    });

  } catch (error) {
    console.error('API route error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

// Handle preflight requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
      'Access-Control-Allow-Methods': process.env.CORS_METHODS || 'POST, OPTIONS',
      'Access-Control-Allow-Headers': process.env.CORS_HEADERS || 'Content-Type',
    },
  });
}
