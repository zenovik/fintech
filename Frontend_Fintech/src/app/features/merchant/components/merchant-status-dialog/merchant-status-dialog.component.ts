import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MERCHANT_STATUSES, MerchantStatus } from '../../constants/merchant.constants';

@Component({
  selector: 'app-merchant-status-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title>Change Merchant Status</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Status</mat-label>
          <mat-select formControlName="status">
            @for (s of statuses; track s) {
              <mat-option [value]="s">{{ s | titlecase }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Reason (optional)</mat-label>
          <textarea matInput formControlName="reason" rows="3"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="submit()">Update Status</button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; display: block; margin-bottom: 8px; }`],
})
export class MerchantStatusDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<MerchantStatusDialogComponent>);
  readonly data = inject<{ currentStatus: MerchantStatus }>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);

  readonly statuses = MERCHANT_STATUSES;

  readonly form = this.fb.group({
    status: [this.data.currentStatus, Validators.required],
    reason: [''],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.getRawValue());
  }
}
