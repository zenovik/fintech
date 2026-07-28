import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RoleStateService } from '../../services/role-state.service';

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule],
  template: `
    <div class="role-form">
      <h1>{{ isEdit ? 'Edit Role' : 'Create Role' }}</h1>
      <form [formGroup]="form" (ngSubmit)="submit()">
        @if (!isEdit) {
          <mat-form-field appearance="outline" class="full"><mat-label>Code</mat-label><input matInput formControlName="code" /></mat-form-field>
        }
        <mat-form-field appearance="outline" class="full"><mat-label>Name</mat-label><input matInput formControlName="name" /></mat-form-field>
        <mat-form-field appearance="outline" class="full"><mat-label>Description</mat-label><textarea matInput formControlName="description" rows="3"></textarea></mat-form-field>
        <button type="submit" class="btn btn--primary" [disabled]="form.invalid">Save</button>
        <a routerLink="/roles" class="btn btn--outline">Cancel</a>
      </form>
    </div>
  `,
  styles: [`.role-form { max-width: 560px; margin: 0 auto; } .full { width: 100%; display: block; } form { display: flex; flex-direction: column; gap: 8px; }
    .btn { padding: 10px 20px; border-radius: 8px; font-weight: 600; border: none; cursor: pointer; text-decoration: none; display: inline-block; margin-right: 8px;
    &--primary { background: #003d9b; color: #fff; } &--outline { background: #fff; border: 1px solid #ddd; } }`],
})
export class RoleFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  readonly state = inject(RoleStateService);
  isEdit = false;
  roleId: number | null = null;
  readonly form = this.fb.group({ code: ['', [Validators.required, Validators.pattern(/^[a-z][a-z0-9_]*$/)]], name: ['', Validators.required], description: [''] });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && this.route.snapshot.url.some((s) => s.path === 'edit')) {
      this.isEdit = true;
      this.roleId = Number(id);
      this.form.get('code')?.disable();
      this.state.loadRole(this.roleId);
      const t = setInterval(() => {
        const r = this.state.selectedRole();
        if (r) { this.form.patchValue({ code: r.code, name: r.name, description: r.description ?? '' }); clearInterval(t); }
      }, 100);
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    if (this.isEdit && this.roleId) this.state.updateRole(this.roleId, { name: v.name, description: v.description });
    else this.state.createRole(v);
  }
}
