import { Injectable, computed, inject, signal } from '@angular/core';
import { TimeoutError, timeout } from 'rxjs';
import { DashboardAiApiService } from './dashboard-ai-api.service';
import { NotificationService } from '../../../core/auth/services/notification.service';
import { DashboardAiChatMessage, DashboardAiQuickAction } from '../models/dashboard-ai.models';
import { DashboardPeriod } from '../constants/dashboard.constants';
import { AI_REQUEST_TIMEOUT_MS, resolveAiErrorMessage } from '../constants/dashboard-ai.constants';

@Injectable({ providedIn: 'root' })
export class DashboardAiSessionService {
  private readonly api = inject(DashboardAiApiService);
  private readonly notifications = inject(NotificationService);

  readonly drawerOpen = signal(false);
  readonly messages = signal<DashboardAiChatMessage[]>([]);
  readonly loading = signal(false);
  readonly lastFailedPayload = signal<{ quickAction?: DashboardAiQuickAction; message?: string } | null>(null);
  readonly hasMessages = computed(() => this.messages().length > 0);

  openDrawer(): void {
    this.drawerOpen.set(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  runQuickAction(quickAction: DashboardAiQuickAction, period: DashboardPeriod, label: string): void {
    this.openDrawer();
    this.dispatch({ quickAction, period }, label);
  }

  askQuestion(message: string, period: DashboardPeriod): void {
    this.openDrawer();
    this.dispatch({ message, period }, message);
  }

  retry(period: DashboardPeriod): void {
    const payload = this.lastFailedPayload();
    if (!payload || this.loading()) return;
    this.messages.update((items) => {
      const filtered = [...items];
      while (filtered.length && filtered[filtered.length - 1].error) filtered.pop();
      if (filtered.length && filtered[filtered.length - 1].role === 'user') filtered.pop();
      return filtered;
    });
    this.dispatch(payload, payload.message ?? 'Retry');
  }

  clear(): void {
    if (this.loading()) return;
    this.messages.set([]);
    this.lastFailedPayload.set(null);
    this.notifications.info('Conversation cleared');
  }

  copy(text: string): void {
    navigator.clipboard.writeText(text).then(
      () => this.notifications.success('Copied to clipboard'),
      () => this.notifications.error('Failed to copy'),
    );
  }

  private dispatch(
    payload: { quickAction?: DashboardAiQuickAction; message?: string; period?: DashboardPeriod },
    displayLabel: string,
  ): void {
    if (this.loading()) return;

    this.lastFailedPayload.set(payload);
    const userMessage: DashboardAiChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: displayLabel,
      createdAt: new Date().toISOString(),
    };

    this.messages.update((items) => [...items, userMessage]);
    this.loading.set(true);

    this.api
      .chat(payload)
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
              createdAt: response.dataTimestamp ?? new Date().toISOString(),
            },
          ]);
        }
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        const friendly = err instanceof TimeoutError
          ? resolveAiErrorMessage({ error: { code: 'AI_TIMEOUT' } })
          : resolveAiErrorMessage(err);
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
}
