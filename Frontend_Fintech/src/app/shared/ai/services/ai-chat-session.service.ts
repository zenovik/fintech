import { Injectable, computed, inject, signal } from '@angular/core';
import { TimeoutError, timeout } from 'rxjs';
import { AiApiService } from './ai-api.service';
import { NotificationService } from '../../../core/auth/services/notification.service';
import { AiChatMessage } from '../models/ai.models';
import { AI_REQUEST_TIMEOUT_MS, resolveAiErrorMessage } from '../constants/ai.constants';

@Injectable({ providedIn: 'root' })
export class AiChatSessionService {
  private readonly api = inject(AiApiService);
  private readonly notifications = inject(NotificationService);

  readonly messages = signal<AiChatMessage[]>([]);
  readonly loading = signal(false);
  readonly lastFailedMessage = signal<string | null>(null);
  readonly lastErrorCode = signal<string | null>(null);
  readonly hasMessages = computed(() => this.messages().length > 0);

  send(message: string): void {
    const trimmed = message.trim();
    if (!trimmed || this.loading()) return;

    this.lastFailedMessage.set(null);
    this.lastErrorCode.set(null);

    const userMessage: AiChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    this.messages.update((items) => [...items, userMessage]);
    this.loading.set(true);

    this.api
      .chat({ message: trimmed })
      .pipe(timeout(AI_REQUEST_TIMEOUT_MS))
      .subscribe({
        next: (response) => {
          if (response.reply) {
            this.messages.update((items) => [
              ...items,
              {
                id: response.messageId,
                role: 'assistant',
                content: response.reply!,
                createdAt: new Date().toISOString(),
              },
            ]);
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.lastFailedMessage.set(trimmed);
          this.lastErrorCode.set(this.resolveErrorCode(err));
          const friendly = this.resolveFriendlyError(err);
          this.messages.update((items) => [
            ...items,
            {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: friendly,
              createdAt: new Date().toISOString(),
              error: true,
            },
          ]);
          this.notifications.error(friendly);
        },
      });
  }

  retry(): void {
    const message = this.lastFailedMessage();
    if (!message || this.loading()) return;

    this.messages.update((items) => {
      const filtered = [...items];
      while (filtered.length && filtered[filtered.length - 1].error) {
        filtered.pop();
      }
      if (
        filtered.length &&
        filtered[filtered.length - 1].role === 'user' &&
        filtered[filtered.length - 1].content === message
      ) {
        filtered.pop();
      }
      return filtered;
    });

    this.send(message);
  }

  clear(): void {
    if (this.loading()) return;

    this.api.chat({ clearHistory: true }).subscribe({
      next: () => {
        this.messages.set([]);
        this.lastFailedMessage.set(null);
        this.lastErrorCode.set(null);
        this.notifications.info('Conversation cleared');
      },
      error: () => {
        this.messages.set([]);
        this.lastFailedMessage.set(null);
        this.lastErrorCode.set(null);
        this.notifications.info('Conversation cleared locally');
      },
    });
  }

  copy(text: string): void {
    navigator.clipboard.writeText(text).then(
      () => this.notifications.success('Copied to clipboard'),
      () => this.notifications.error('Failed to copy'),
    );
  }

  private resolveErrorCode(err: unknown): string | null {
    if (err instanceof TimeoutError) {
      return 'AI_TIMEOUT';
    }
    const code = (err as { error?: { code?: string } })?.error?.code;
    return code ?? null;
  }

  private resolveFriendlyError(err: unknown): string {
    if (err instanceof TimeoutError) {
      return resolveAiErrorMessage({ error: { code: 'AI_TIMEOUT' } });
    }
    return resolveAiErrorMessage(err as { error?: { code?: string; message?: string }; message?: string });
  }
}
