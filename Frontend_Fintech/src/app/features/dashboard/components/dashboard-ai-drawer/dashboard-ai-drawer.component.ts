import { Component, inject, input, output } from '@angular/core';
import { DashboardAiChatPanelComponent } from '../dashboard-ai-chat-panel/dashboard-ai-chat-panel.component';

@Component({
  selector: 'app-dashboard-ai-drawer',
  standalone: true,
  imports: [DashboardAiChatPanelComponent],
  templateUrl: './dashboard-ai-drawer.component.html',
  styleUrl: './dashboard-ai-drawer.component.scss',
})
export class DashboardAiDrawerComponent {
  readonly open = input(false);
  readonly canChat = input(true);
  readonly closed = output<void>();
}
