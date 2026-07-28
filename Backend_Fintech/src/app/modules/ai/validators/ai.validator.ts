import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ValidationError } from '../../../shared/exceptions/app.exception';

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) throw new ValidationError(result.error.issues[0]?.message ?? 'Invalid body');
    req.body = result.data;
    next();
  };
}
