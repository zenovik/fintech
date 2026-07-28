import { Component, input, output } from '@angular/core';
import {
  DASHBOARD_AI_QUICK_ACTIONS,
  DASHBOARD_AI_SUGGESTED_QUESTIONS,
} from '../../constants/dashboard-ai.constants';
import { DashboardAiQuickAction } from '../../models/dashboard-ai.models';

@Component({
  selector: 'app-dashboard-ai-quick-actions',
  standalone: true,
  templateUrl: './dashboard-ai-quick-actions.component.html',
  styleUrl: './dashboard-ai-quick-actions.component.scss',
})
export class DashboardAiQuickActionsComponent {
  readonly disabled = input(false);
  readonly quickActions = DASHBOARD_AI_QUICK_ACTIONS;
  readonly suggestedQuestions = DASHBOARD_AI_SUGGESTED_QUESTIONS;

  readonly quickAction = output<{ action: DashboardAiQuickAction; label: string }>();
  readonly suggestedQuestion = output<string>();
}
