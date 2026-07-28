import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AI_MAX_PROMPT_LENGTH } from '../../constants/ai.constants';

@Component({
  selector: 'app-ai-chat-input',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './ai-chat-input.component.html',
  styleUrl: './ai-chat-input.component.scss',
})
export class AiChatInputComponent {
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly sendMessage = output<string>();

  readonly maxLength = AI_MAX_PROMPT_LENGTH;
  draft = '';

  get charCount(): number {
    return this.draft.length;
  }

  get nearLimit(): boolean {
    return this.charCount >= this.maxLength * 0.9;
  }

  get atLimit(): boolean {
    return this.charCount >= this.maxLength;
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.submit();
    }
  }

  onInput(): void {
    if (this.draft.length > this.maxLength) {
      this.draft = this.draft.slice(0, this.maxLength);
    }
  }

  submit(): void {
    const value = this.draft.trim();
    if (!value || this.disabled() || this.loading()) return;
    this.sendMessage.emit(value);
    this.draft = '';
  }
}
