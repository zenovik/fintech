import crypto from 'crypto';

export function sha256(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export function generateOtp(length = 6): string {
  const max = 10 ** length;
  const num = crypto.randomInt(0, max);
  return num.toString().padStart(length, '0');
}

export function maskPhone(phone: string): string {
  if (phone.length < 4) return '••••';
  return phone.replace(/\d(?=\d{4})/g, '•');
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${'•'.repeat(Math.max(1, local.length - 2))}@${domain}`;
}

export function buildDeviceFingerprint(userAgent: string, ip: string): string {
  return sha256(`${userAgent}|${ip}`);
}

export function parseUserAgent(userAgent: string): { browser: string; os: string; deviceName: string } {
  const ua = userAgent || 'Unknown';
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';

  if (ua.includes('Chrome/')) browser = `Chrome ${ua.match(/Chrome\/([\d.]+)/)?.[1] ?? ''}`.trim();
  else if (ua.includes('Firefox/')) browser = `Firefox ${ua.match(/Firefox\/([\d.]+)/)?.[1] ?? ''}`.trim();
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari Mobile';
  else if (ua.includes('MerchantApp')) browser = 'Merchant App';

  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('iPhone') || ua.includes('iOS')) os = 'iOS';
  else if (ua.includes('iPad')) os = 'iPadOS';
  else if (ua.includes('Android')) os = 'Android';

  const deviceName = `${os} - ${browser}`;
  return { browser, os, deviceName };
}
