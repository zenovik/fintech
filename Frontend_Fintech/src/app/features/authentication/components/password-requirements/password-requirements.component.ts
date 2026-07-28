import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PASSWORD_RULES } from '../../../../core/auth/constants/auth.constants';

interface Requirement {
  id: string;
  label: string;
  valid: boolean;
}

@Component({
  selector: 'app-password-requirements',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './password-requirements.component.html',
  styleUrl: './password-requirements.component.scss',
})
export class PasswordRequirementsComponent implements OnChanges {
  @Input() password = '';

  requirements: Requirement[] = [];
  strengthScore = 0;
  strengthLabel = 'Too Weak';

  ngOnChanges(): void {
    this.updateRequirements();
  }

  private updateRequirements(): void {
    const val = this.password;
    const hasLength = val.length >= PASSWORD_RULES.MIN_LENGTH;
    const hasUpper = PASSWORD_RULES.UPPERCASE.test(val);
    const hasNumber = PASSWORD_RULES.NUMBER_OR_SPECIAL.test(val);

    this.requirements = [
      { id: 'length', label: 'At least 8 characters', valid: hasLength },
      { id: 'upper', label: 'One uppercase letter', valid: hasUpper },
      { id: 'number', label: 'One number or special character', valid: hasNumber },
    ];

    let score = 0;
    if (hasLength) score++;
    if (hasUpper) score++;
    if (hasNumber) score++;
    if (val.length > 12) score++;

    this.strengthScore = val.length > 0 ? score : 0;
    const labels = ['Too Weak', 'Fair', 'Strong', 'Bulletproof'];
    this.strengthLabel = val.length > 0 ? labels[Math.max(0, score - 1)] : 'Too Weak';
  }
}
