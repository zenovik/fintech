import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-reversal-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>Process Reversal</h2>
    <mat-dialog-content>
      <p class="hint">Settlement: {{ data.settlementRef }} · Max: {{ data.maxAmount | currency: data.currency }}</p>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Reversal Amount</mat-label>
          <input matInput type="number" formControlName="amount" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Reason</mat-label>
          <textarea matInput formControlName="reason" rows="3"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="warn" [disabled]="form.invalid" (click)="submit()">Process Reversal</button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; display: block; } .hint { font-size: 13px; color: #737685; margin-bottom: 12px; }`],
})
export class ReversalDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<ReversalDialogComponent>);
  readonly data = inject<{ maxAmount: number; currency: string; settlementRef: string }>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    amount: [this.data.maxAmount, [Validators.required, Validators.min(0.01), Validators.max(this.data.maxAmount)]],
    reason: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.getRawValue());
  }
}
