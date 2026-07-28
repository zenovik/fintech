import { emailService } from '../../../app/shared/email/email.service';

let originalSendEmail: typeof emailService.sendEmail | null = null;

export function stubExternalEmail(): void {
  originalSendEmail = emailService.sendEmail.bind(emailService);
  emailService.sendEmail = async () => ({
    success: true,
    logId: 0,
  });
}

export function restoreExternalEmail(): void {
  if (originalSendEmail) {
    emailService.sendEmail = originalSendEmail;
    originalSendEmail = null;
  }
}

export function stubFetchSuccess(): () => void {
  const original = globalThis.fetch;
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//i.test(url)) {
      return original(input, init);
    }
    return new Response('ok', { status: 200, headers: { 'Content-Type': 'text/plain' } });
  };
  return () => {
    globalThis.fetch = original;
  };
}

export function stubFetchFailure(status = 502): () => void {
  const original = globalThis.fetch;
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//i.test(url)) {
      return original(input, init);
    }
    return new Response('error', { status, headers: { 'Content-Type': 'text/plain' } });
  };
  return () => {
    globalThis.fetch = original;
  };
}
