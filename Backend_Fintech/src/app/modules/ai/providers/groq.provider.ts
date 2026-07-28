import { AppError } from '../../../shared/exceptions/app.exception';
import { AI_ERROR_CODES } from '../constants/ai.constants';
import {
  AiChatMessage,
  AiChatResult,
  AiProvider,
  AiRequestContext,
} from './ai-provider.interface';

export class GroqProvider implements AiProvider {
  readonly name = 'groq';

  async chat(_messages: AiChatMessage[], _context: AiRequestContext): Promise<AiChatResult> {
    throw new AppError(
      503,
      'Groq provider is not yet implemented.',
      AI_ERROR_CODES.AI_PROVIDER_UNAVAILABLE,
    );
  }
}
