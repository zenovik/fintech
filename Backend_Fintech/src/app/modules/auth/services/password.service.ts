import bcrypt from 'bcryptjs';
import { env } from '../../../config';
import { PASSWORD_REGEX } from '../constants/auth.constants';
import { ValidationError } from '../../../shared/exceptions/app.exception';
import { PasswordHistoryRepository } from '../repositories/password-history.repository';
import { SettingsRepository } from '../../settings/repositories/settings.repository';

export class PasswordService {
  constructor(
    private readonly passwordHistoryRepo = new PasswordHistoryRepository(),
    private readonly settingsRepo = new SettingsRepository(),
  ) {}

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, env.auth.bcryptRounds);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  validatePolicy(password: string): void {
    if (password.length < PASSWORD_REGEX.MIN_LENGTH) {
      throw new ValidationError('Password must be at least 8 characters');
    }
    if (!PASSWORD_REGEX.UPPERCASE.test(password)) {
      throw new ValidationError('Password must contain at least one uppercase letter');
    }
    if (!PASSWORD_REGEX.NUMBER_OR_SPECIAL.test(password)) {
      throw new ValidationError('Password must contain at least one number or special character');
    }
  }

  async validatePolicyAsync(password: string): Promise<void> {
    const policy = await this.settingsRepo.getPasswordPolicy();
    const minLength = policy?.minLength ?? PASSWORD_REGEX.MIN_LENGTH;
    const requireUppercase = policy?.requireUppercase ?? true;
    const requireLowercase = policy?.requireLowercase ?? false;
    const requireNumber = policy?.requireNumber ?? true;
    const requireSpecial = policy?.requireSpecial ?? true;

    if (password.length < minLength) {
      throw new ValidationError(`Password must be at least ${minLength} characters`);
    }
    if (requireUppercase && !PASSWORD_REGEX.UPPERCASE.test(password)) {
      throw new ValidationError('Password must contain at least one uppercase letter');
    }
    if (requireLowercase && !/[a-z]/.test(password)) {
      throw new ValidationError('Password must contain at least one lowercase letter');
    }
    if (requireNumber && !/[0-9]/.test(password)) {
      throw new ValidationError('Password must contain at least one number');
    }
    if (requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      throw new ValidationError('Password must contain at least one special character');
    }
    if (!requireNumber && !requireSpecial && !PASSWORD_REGEX.NUMBER_OR_SPECIAL.test(password)) {
      throw new ValidationError('Password must contain at least one number or special character');
    }
  }

  async ensureNotReused(userId: number, newPasswordHash: string): Promise<void> {
    const reused = await this.passwordHistoryRepo.isReused(userId, newPasswordHash);
    if (reused) {
      throw new ValidationError('Password was recently used. Please choose a different password.');
    }
  }
}
