import { Component, ElementRef, ViewChild, afterNextRender, effect, inject, input, output } from '@angular/core';
import { AiMessageListComponent } from '../ai-message-list/ai-message-list.component';
import { AiChatInputComponent } from '../ai-chat-input/ai-chat-input.component';
import { AiChatSessionService } from '../../services/ai-chat-session.service';

@Component({
  selector: 'app-ai-chat-panel',
  standalone: true,
  imports: [AiMessageListComponent, AiChatInputComponent],
  templateUrl: './ai-chat-panel.component.html',
  styleUrl: './ai-chat-panel.component.scss',
})
export class AiChatPanelComponent {
  readonly canChat = input(true);
  readonly closePanel = output<void>();

  readonly session = inject(AiChatSessionService);

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
    const threshold = 80;
    this.stickToBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }

  onSend(message: string): void {
    this.stickToBottom = true;
    this.session.send(message);
  }

  onClear(): void {
    this.stickToBottom = true;
    this.session.clear();
  }

  onRetry(): void {
    this.stickToBottom = true;
    this.session.retry();
  }

  onCopy(content: string): void {
    this.session.copy(content);
  }

  private scrollToBottom(force: boolean): void {
    if (!force && !this.stickToBottom) return;
    this.scrollAnchor?.nativeElement.scrollIntoView({ behavior: force ? 'auto' : 'smooth' });
  }
}
