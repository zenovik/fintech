import { AppError } from '../../../shared/exceptions/app.exception';
import { AI_ERROR_CODES } from '../constants/ai.constants';
import { PROMPT_INJECTION_PATTERNS, SENSITIVE_RESPONSE_PATTERNS } from '../constants/ai.constants';

export class AiSecurityService {
  sanitizePrompt(input: string): string {
    return input
      .replace(/\0/g, '')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{4,}/g, '\n\n\n')
      .trim();
  }

  assertSafePrompt(input: string): void {
    const sanitized = this.sanitizePrompt(input);
    if (!sanitized) {
      throw new AppError(400, 'Message cannot be empty.', AI_ERROR_CODES.VALIDATION_ERROR);
    }

    for (const pattern of PROMPT_INJECTION_PATTERNS) {
      if (pattern.test(sanitized)) {
        throw new AppError(400, 'Message contains disallowed content.', AI_ERROR_CODES.AI_UNSAFE_PROMPT);
      }
    }
  }

  sanitizeResponse(output: string): string {
    let sanitized = output;
    for (const pattern of SENSITIVE_RESPONSE_PATTERNS) {
      sanitized = sanitized.replace(pattern, '[redacted]');
    }
    return sanitized.trim();
  }
}

export const aiSecurityService = new AiSecurityService();
