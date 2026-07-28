import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-dispute-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>Open Dispute</h2>
    <mat-dialog-content>
      <p class="hint">Transaction: {{ data.transactionRef }}</p>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Dispute Reason</mat-label>
          <textarea matInput formControlName="reason" rows="4" placeholder="Describe the dispute reason..."></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button color="warn" [disabled]="form.invalid" (click)="submit()">Open Dispute</button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; display: block; } .hint { font-size: 13px; color: #737685; margin-bottom: 12px; }`],
})
export class DisputeDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<DisputeDialogComponent>);
  readonly data = inject<{ transactionRef: string }>(MAT_DIALOG_DATA);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    reason: ['', [Validators.required, Validators.minLength(10)]],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.getRawValue());
  }
}
