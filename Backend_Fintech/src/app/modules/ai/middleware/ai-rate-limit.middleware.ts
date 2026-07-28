import rateLimit from 'express-rate-limit';
import { env } from '../../../config';
import { auditRecorder } from '../../audit/services/audit-recorder.service';
import { rateLimitKeyFromUserOrIp } from '../../../shared/middleware/rate-limit-key.util';

export const aiChatRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: env.ai.rateLimitPerMinute,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => rateLimitKeyFromUserOrIp(req, req.user?.sub),
  handler: (req, res) => {
    void auditRecorder.record({
      module: 'ai',
      categoryCode: 'system',
      actionCode: 'ai_chat_request',
      entityType: 'ai_session',
      entityId: req.user?.sessionId ? String(req.user.sessionId) : undefined,
      description: 'AI chat request blocked by rate limit.',
      riskLevel: 'medium',
      afterValues: {
        success: false,
        rateLimited: true,
        userId: req.user?.sub ?? null,
      },
      metadata: {
        provider: env.ai.provider,
        rateLimited: 'true',
      },
    }, {
      userId: req.user?.sub,
      sessionId: req.user?.sessionId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });

    res.status(429).json({
      success: false,
      message: 'AI rate limit exceeded. Please wait before sending more messages.',
      code: 'AI_RATE_LIMITED',
    });
  },
});
