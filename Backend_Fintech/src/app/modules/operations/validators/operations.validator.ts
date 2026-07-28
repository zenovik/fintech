import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ValidationError } from '../../../shared/exceptions/app.exception';

export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) throw new ValidationError(result.error.issues[0]?.message ?? 'Invalid query');
    req.query = result.data as typeof req.query;
    next();
  };
}

export function validateParams(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) throw new ValidationError(result.error.issues[0]?.message ?? 'Invalid params');
    req.params = result.data as typeof req.params;
    next();
  };
}
