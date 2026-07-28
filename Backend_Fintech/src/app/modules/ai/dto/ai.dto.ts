import { z } from 'zod';
import { env } from '../../../config';

export const aiChatBodySchema = z.object({
  message: z.string().trim().min(1, 'Message cannot be empty').max(env.ai.maxPromptLength, `Message must be at most ${env.ai.maxPromptLength} characters`).optional(),
  clearHistory: z.boolean().optional(),
}).superRefine((data, ctx) => {
  if (data.clearHistory) return;
  if (!data.message) {
    ctx.addIssue({ code: 'custom', message: 'Message is required' });
  }
});

export type AiChatBodyDto = z.infer<typeof aiChatBodySchema>;
