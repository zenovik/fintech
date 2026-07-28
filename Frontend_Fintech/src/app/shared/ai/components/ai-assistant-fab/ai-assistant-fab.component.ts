import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-ai-assistant-fab',
  standalone: true,
  templateUrl: './ai-assistant-fab.component.html',
  styleUrl: './ai-assistant-fab.component.scss',
})
export class AiAssistantFabComponent {
  readonly open = input(false);
  readonly toggled = output<void>();
}
