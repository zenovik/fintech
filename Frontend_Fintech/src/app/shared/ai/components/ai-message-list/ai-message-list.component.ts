import { Component, input, output } from '@angular/core';
import { AiChatMessage } from '../../models/ai.models';

@Component({
  selector: 'app-ai-message-list',
  standalone: true,
  templateUrl: './ai-message-list.component.html',
  styleUrl: './ai-message-list.component.scss',
})
export class AiMessageListComponent {
  readonly messages = input<AiChatMessage[]>([]);
  readonly loading = input(false);
  readonly copyMessage = output<string>();
}
