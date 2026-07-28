import { Component, ElementRef, ViewChild, afterNextRender, effect, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AiChatInputComponent } from '../../../../shared/ai/components/ai-chat-input/ai-chat-input.component';
import { DashboardAiQuickActionsComponent } from '../dashboard-ai-quick-actions/dashboard-ai-quick-actions.component';
import { DashboardAiSessionService } from '../../services/dashboard-ai-session.service';
import { DashboardStateService } from '../../services/dashboard-state.service';
import { DashboardPeriod } from '../../constants/dashboard.constants';
import { DashboardAiQuickAction } from '../../models/dashboard-ai.models';

@Component({
  selector: 'app-dashboard-ai-chat-panel',
  standalone: true,
  imports: [DatePipe, AiChatInputComponent, DashboardAiQuickActionsComponent],
  templateUrl: './dashboard-ai-chat-panel.component.html',
  styleUrl: './dashboard-ai-chat-panel.component.scss',
})
export class DashboardAiChatPanelComponent {
  readonly canChat = input(true);
  readonly session = inject(DashboardAiSessionService);
  readonly dashboardState = inject(DashboardStateService);

  @ViewChild('bodyEl') private bodyEl?: ElementRef<HTMLElement>;
  @ViewChild('scrollAnchor') private scrollAnchor?: ElementRef<HTMLDivElement>;

  private stickToBottom = true;

  constructor() {
    afterNextRender(() => this.scrollToBottom(true));
    effect(() => {
      this.session.messages();
      this.session.loading();
      queueMicrotask(() => this.scrollToBottom(false));
    });
  }

  onBodyScroll(): void {
    const el = this.bodyEl?.nativeElement;
    if (!el) return;
    this.stickToBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  onQuickAction(action: DashboardAiQuickAction, label: string): void {
    this.stickToBottom = true;
    this.session.runQuickAction(action, this.currentPeriod(), label);
  }

  onSuggestedQuestion(question: string): void {
    this.stickToBottom = true;
    this.session.askQuestion(question, this.currentPeriod());
  }

  onSend(message: string): void {
    this.stickToBottom = true;
    this.session.askQuestion(message, this.currentPeriod());
  }

  onClear(): void {
    this.stickToBottom = true;
    this.session.clear();
  }

  onRetry(): void {
    this.stickToBottom = true;
    this.session.retry(this.currentPeriod());
  }

  onCopy(content: string): void {
    this.session.copy(content);
  }

  close(): void {
    this.session.closeDrawer();
  }

  private currentPeriod(): DashboardPeriod {
    return this.dashboardState.period();
  }

  private scrollToBottom(force: boolean): void {
    if (!force && !this.stickToBottom) return;
    this.scrollAnchor?.nativeElement.scrollIntoView({ behavior: force ? 'auto' : 'smooth' });
  }
}
