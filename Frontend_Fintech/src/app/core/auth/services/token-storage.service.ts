import { Injectable } from '@angular/core';
import { AuthUser } from '../models/auth.models';
import { AUTH_STORAGE_KEYS } from '../constants/auth.constants';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  getAccessToken(): string | null {
    return null;
  }

  setAccessToken(_token: string, expiresIn: string): void {
    this.clearLegacyAccessToken();
    const expiryMs = this.parseExpiryToMs(expiresIn);
    if (expiryMs) {
      sessionStorage.setItem(AUTH_STORAGE_KEYS.TOKEN_EXPIRY, String(Date.now() + expiryMs));
    }
  }

  clearAccessToken(): void {
    this.clearLegacyAccessToken();
    sessionStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN_EXPIRY);
  }

  clearLegacyAccessToken(): void {
    localStorage.removeItem(AUTH_STORAGE_KEYS.ACCESS_TOKEN);
  }

  isTokenExpired(): boolean {
    const expiry = sessionStorage.getItem(AUTH_STORAGE_KEYS.TOKEN_EXPIRY);
    if (!expiry) return false;
    return Date.now() >= parseInt(expiry, 10);
  }

  getUser(): AuthUser | null {
    const raw = localStorage.getItem(AUTH_STORAGE_KEYS.USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  setUser(user: AuthUser): void {
    localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(user));
  }

  clearUser(): void {
    localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
  }

  clearAll(): void {
    this.clearAccessToken();
    this.clearUser();
    localStorage.removeItem(AUTH_STORAGE_KEYS.MFA_CHALLENGE);
    localStorage.removeItem(AUTH_STORAGE_KEYS.REMEMBER_DEVICE);
  }

  hasSessionHint(): boolean {
    return Boolean(this.getUser()) || Boolean(sessionStorage.getItem(AUTH_STORAGE_KEYS.TOKEN_EXPIRY));
  }

  private parseExpiryToMs(expiry: string): number | null {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return null;
    const value = parseInt(match[1], 10);
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return value * (multipliers[match[2]] ?? multipliers['m']);
  }
}
