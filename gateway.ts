import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import 'dotenv/config';

// Initialize OpenAI provider pointing to Vercel AI Gateway
const openai = createOpenAI({
  apiKey: process.env.VERCEL_AI_API_KEY,
  baseURL: 'https://gateway.ai.vercel.dev/v1',
});

async function main() {
  console.log("Connecting to Vercel AI Gateway...");
  
  try {
    const result = await streamText({
      model: openai('gpt-3.5-turbo'), // Using a standard model supported by the gateway
      prompt: 'Invent a new holiday and describe its traditions in 2 sentences.',
    });

    console.log("\n--- AI Response ---\n");
    
    for await (const textPart of result.textStream) {
      (process as any).stdout.write(textPart);
    }

    console.log("\n\n-------------------");
    console.log('Token usage:', await result.usage);
    console.log('Finish reason:', await result.finishReason);
    
  } catch (error) {
    console.error("Error connecting to AI Gateway:", error);
  }
}

main().catch(console.error);