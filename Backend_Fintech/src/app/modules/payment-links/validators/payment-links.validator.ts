import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ValidationError } from '../../../shared/exceptions/app.exception';

function validate(schema: ZodSchema, source: 'body' | 'query' | 'params') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      next(new ValidationError(result.error.issues.map((i) => i.message).join('; ')));
      return;
    }
    req[source] = result.data;
    next();
  };
}

export const validateBody = (schema: ZodSchema) => validate(schema, 'body');
export const validateQuery = (schema: ZodSchema) => validate(schema, 'query');
export const validateParams = (schema: ZodSchema) => validate(schema, 'params');
