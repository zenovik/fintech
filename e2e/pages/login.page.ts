import { BasePage } from './base.page';
import { ROUTES } from '../data/constants';

export class LoginPage extends BasePage {
  async open(): Promise<void> {
    await this.goto(ROUTES.login);
  }

  emailInput = () => this.page.locator('#email');
  passwordInput = () => this.page.locator('#password');
  submitButton = () => this.page.getByRole('button', { name: 'Sign In' });
  forgotPasswordLink = () => this.page.getByRole('link', { name: 'Forgot Password?' });

  async login(email: string, password: string): Promise<void> {
    await this.emailInput().fill(email);
    await this.passwordInput().fill(password);
    await this.submitButton().click();
  }

  async expectLoginForm(): Promise<void> {
    await this.expectHeading('Sign In');
    await this.emailInput().waitFor({ state: 'visible' });
  }

  async expectError(): Promise<void> {
    await this.alert().waitFor({ state: 'visible' });
  }
}

export class ForgotPasswordPage extends BasePage {
  async open(): Promise<void> {
    await this.goto(ROUTES.forgotPassword);
  }

  async submitEmail(email: string): Promise<void> {
    await this.page.locator('#email').fill(email);
    await this.page.getByRole('button', { name: 'Send Reset Link' }).click();
  }
}

export class ResetPasswordPage extends BasePage {
  async open(token: string): Promise<void> {
    await this.goto(`${ROUTES.resetPassword}?token=${encodeURIComponent(token)}`);
  }

  async reset(newPassword: string): Promise<void> {
    await this.page.locator('input[formcontrolname="newPassword"]').fill(newPassword);
    await this.page.locator('input[formcontrolname="confirmPassword"]').fill(newPassword);
    await this.page.getByRole('button', { name: /reset|submit|save/i }).click();
  }
}

export class SessionExpiredPage extends BasePage {
  async open(): Promise<void> {
    await this.goto(ROUTES.sessionExpired);
  }
}
