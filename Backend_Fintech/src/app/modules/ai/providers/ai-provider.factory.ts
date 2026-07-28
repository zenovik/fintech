import { env } from '../../../config';
import { AppError } from '../../../shared/exceptions/app.exception';
import { AiProvider } from './ai-provider.interface';
import { GeminiProvider } from './gemini.provider';
import { GroqProvider } from './groq.provider';
import { OpenAIProvider } from './openai.provider';

let cachedProvider: AiProvider | null = null;

export function createAiProvider(): AiProvider {
  if (cachedProvider) return cachedProvider;

  switch (env.ai.provider) {
    case 'gemini':
      cachedProvider = new GeminiProvider();
      break;
    case 'openai':
      cachedProvider = new OpenAIProvider();
      break;
    case 'groq':
      cachedProvider = new GroqProvider();
      break;
    default:
      throw new AppError(500, `Unsupported AI provider: ${env.ai.provider}`, 'AI_PROVIDER_INVALID');
  }

  return cachedProvider;
}
