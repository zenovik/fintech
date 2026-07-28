import { Component, input, output } from '@angular/core';
import { AiChatPanelComponent } from '../ai-chat-panel/ai-chat-panel.component';

@Component({
  selector: 'app-ai-drawer',
  standalone: true,
  imports: [AiChatPanelComponent],
  templateUrl: './ai-drawer.component.html',
  styleUrl: './ai-drawer.component.scss',
})
export class AiDrawerComponent {
  readonly open = input(false);
  readonly canChat = input(true);
  readonly closed = output<void>();
}
