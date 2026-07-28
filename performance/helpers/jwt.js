/**
 * JWT utilities — decode payload for org/user context (no verification in perf tests).
 */
import encoding from 'k6/encoding';

export function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const json = encoding.b64decode(parts[1], 'rawstd', 's');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getOrgFromToken(token) {
  const payload = decodeJwtPayload(token);
  return payload?.organizationId ?? payload?.orgId ?? null;
}

export function isTokenExpired(token, skewSeconds = 30) {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= now + skewSeconds;
}
