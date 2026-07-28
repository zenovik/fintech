export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', code = 'UNAUTHORIZED') {
    super(401, message, code);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', code = 'FORBIDDEN') {
    super(403, message, code);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code = 'NOT_FOUND') {
    super(404, message, code);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: unknown) {
    super(400, message, 'VALIDATION_ERROR', details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code = 'CONFLICT') {
    super(409, message, code);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests', code = 'RATE_LIMITED') {
    super(429, message, code);
  }
}

export class AccountLockedError extends AppError {
  constructor(message = 'Account is temporarily locked') {
    super(423, message, 'ACCOUNT_LOCKED');
  }
}

export class GoneError extends AppError {
  constructor(message: string, code = 'GONE') {
    super(410, message, code);
  }
}
