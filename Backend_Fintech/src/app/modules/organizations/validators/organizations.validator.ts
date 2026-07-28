import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { ValidationError } from '../../../shared/exceptions/app.exception';

function parse<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(result.error.issues.map((i) => i.message).join('; '));
  }
  return result.data;
}

export const validateBody = (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
  req.body = parse(schema, req.body);
  next();
};

export const validateQuery = (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
  req.query = parse(schema, req.query) as typeof req.query;
  next();
};

export const validateParams = (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
  req.params = parse(schema, req.params) as typeof req.params;
  next();
};
