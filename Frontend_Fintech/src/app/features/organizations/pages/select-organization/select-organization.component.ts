import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OrganizationContextService } from '../../services/organization-context.service';
import { DASHBOARD_ROUTES } from '../../../dashboard/constants/dashboard.constants';

@Component({
  selector: 'app-select-organization',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="select-org">
      <div class="select-org__card">
        <h1>Select Organization</h1>
        <p>Choose which organization workspace to continue with.</p>
        @if (!ctx.loaded()) {
          <div class="select-org__loading"><mat-spinner diameter="36" /></div>
        } @else if (!ctx.memberships().length) {
          <p>No organization memberships found for your account.</p>
          <button type="button" (click)="continueWithout()">Continue to Dashboard</button>
        } @else {
          <div class="select-org__list">
            @for (org of ctx.memberships(); track org.id) {
              <button type="button" class="select-org__item" (click)="choose(org.id)">
                <span class="select-org__avatar" [style.background]="org.primaryColor || '#003ec7'">
                  {{ org.logoInitials || 'OR' }}
                </span>
                <span>
                  <strong>{{ org.displayName }}</strong>
                  <small>{{ org.roleName }} · {{ org.code }}</small>
                </span>
              </button>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .select-org {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(160deg, #f8f9fd 0%, #eaedff 100%);
      padding: 24px;
    }
    .select-org__card {
      width: 100%;
      max-width: 480px;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
    }
    h1 { margin: 0 0 8px; font-size: 28px; color: #131b2e; }
    p { margin: 0 0 24px; color: #737685; }
    .select-org__list { display: flex; flex-direction: column; gap: 12px; }
    .select-org__item {
      display: flex; align-items: center; gap: 12px; width: 100%;
      padding: 14px; border: 1px solid #e2e8f0; border-radius: 12px;
      background: #fff; cursor: pointer; text-align: left;
    }
    .select-org__item:hover { border-color: #003d9b; background: #f2f3ff; }
    .select-org__avatar {
      width: 40px; height: 40px; border-radius: 8px; color: #fff;
      display: inline-flex; align-items: center; justify-content: center; font-weight: 700;
    }
    .select-org__item strong { display: block; color: #131b2e; }
    .select-org__item small { color: #737685; }
    .select-org__loading { display: flex; justify-content: center; padding: 24px; }
  `],
})
export class SelectOrganizationComponent implements OnInit {
  readonly ctx = inject(OrganizationContextService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.ctx.load();
  }

  choose(id: number): void {
    this.ctx.select(id);
    this.router.navigateByUrl(DASHBOARD_ROUTES.EXECUTIVE);
  }

  continueWithout(): void {
    this.router.navigateByUrl(DASHBOARD_ROUTES.EXECUTIVE);
  }
}
