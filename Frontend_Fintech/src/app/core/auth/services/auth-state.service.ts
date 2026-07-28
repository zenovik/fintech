import { Injectable, signal, computed } from '@angular/core';
import { AuthUser, MfaChallenge } from '../models/auth.models';
import { TokenStorageService } from './token-storage.service';
import { AUTH_STORAGE_KEYS } from '../constants/auth.constants';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly userSignal = signal<AuthUser | null>(null);
  private readonly authenticatedSignal = signal<boolean>(false);

  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.authenticatedSignal());

  constructor(private readonly tokenStorage: TokenStorageService) {
    this.tokenStorage.clearLegacyAccessToken();
    const user = this.tokenStorage.getUser();
    if (user && this.tokenStorage.hasSessionHint()) {
      this.userSignal.set(user);
      this.authenticatedSignal.set(true);
    }
  }

  setAuthenticated(user: AuthUser, accessToken: string, expiresIn: string): void {
    this.tokenStorage.setAccessToken(accessToken, expiresIn);
    this.tokenStorage.setUser(user);
    this.userSignal.set(user);
    this.authenticatedSignal.set(true);
  }

  clearSession(): void {
    this.tokenStorage.clearAll();
    this.userSignal.set(null);
    this.authenticatedSignal.set(false);
  }

  updateUser(user: AuthUser): void {
    this.tokenStorage.setUser(user);
    this.userSignal.set(user);
  }

  setMfaChallenge(challenge: MfaChallenge): void {
    sessionStorage.setItem(AUTH_STORAGE_KEYS.MFA_CHALLENGE, JSON.stringify(challenge));
  }

  getMfaChallenge(): MfaChallenge | null {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEYS.MFA_CHALLENGE);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as MfaChallenge;
    } catch {
      return null;
    }
  }

  clearMfaChallenge(): void {
    sessionStorage.removeItem(AUTH_STORAGE_KEYS.MFA_CHALLENGE);
  }

  restoreSession(): boolean {
    const user = this.tokenStorage.getUser();
    if (user && this.tokenStorage.hasSessionHint()) {
      this.userSignal.set(user);
      this.authenticatedSignal.set(true);
      return true;
    }
    return false;
  }
}
