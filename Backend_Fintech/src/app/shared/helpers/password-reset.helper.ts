export function buildPasswordResetUrl(corsOrigin: string, token: string): string {
  const base = corsOrigin.replace(/\/$/, '');
  return `${base}/auth/reset-password?token=${encodeURIComponent(token)}`;
}
