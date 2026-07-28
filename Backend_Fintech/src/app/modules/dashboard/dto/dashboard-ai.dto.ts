import { z } from 'zod';
import { env } from '../../../config';
import { DASHBOARD_PERIOD_TYPES } from '../constants/dashboard.constants';
import { DASHBOARD_AI_QUICK_ACTIONS } from '../constants/dashboard-ai.constants';

export const dashboardAiChatBodySchema = z.object({
  quickAction: z.enum(DASHBOARD_AI_QUICK_ACTIONS).optional(),
  message: z.string().trim().min(1).max(env.ai.maxPromptLength).optional(),
  period: z.enum(DASHBOARD_PERIOD_TYPES).optional().default('daily'),
}).superRefine((data, ctx) => {
  if (!data.quickAction && !data.message) {
    ctx.addIssue({ code: 'custom', message: 'Either quickAction or message is required' });
  }
});

export type DashboardAiChatBodyDto = z.infer<typeof dashboardAiChatBodySchema>;
