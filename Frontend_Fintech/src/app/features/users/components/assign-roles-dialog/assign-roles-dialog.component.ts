import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-assign-roles-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatCheckboxModule, MatFormFieldModule],
  template: `
    <h2 mat-dialog-title>Assign Roles</h2>
    <mat-dialog-content>
      <p class="hint">Select roles for {{ data.userName }}</p>
      <form [formGroup]="form">
        @for (role of data.roles; track role.id) {
          <mat-checkbox [formControlName]="'role_' + role.id">{{ role.name }}</mat-checkbox>
        }
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" (click)="submit()">Save</button>
    </mat-dialog-actions>
  `,
  styles: [`form { display: flex; flex-direction: column; gap: 8px; } .hint { font-size: 13px; color: #737685; margin-bottom: 12px; }`],
})
export class AssignRolesDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<AssignRolesDialogComponent>);
  readonly data = inject<{ userName: string; roles: { id: number; name: string }[]; selectedIds: number[] }>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group(
    Object.fromEntries(this.data.roles.map((r) => [`role_${r.id}`, [this.data.selectedIds.includes(r.id)]])),
  );

  submit(): void {
    const roleIds = this.data.roles.filter((r) => this.form.get(`role_${r.id}`)?.value).map((r) => r.id);
    this.dialogRef.close(roleIds);
  }
}
