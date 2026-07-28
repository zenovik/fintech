import {
  Component,
  forwardRef,
  Input,
  Output,
  EventEmitter,
  ViewChildren,
  QueryList,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { OTP_LENGTH } from '../../../../core/auth/constants/auth.constants';

@Component({
  selector: 'app-otp-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './otp-input.component.html',
  styleUrl: './otp-input.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => OtpInputComponent),
      multi: true,
    },
  ],
})
export class OtpInputComponent implements ControlValueAccessor, AfterViewInit {
  @Input() length = OTP_LENGTH;
  @Input() autoFocus = true;
  @Output() completed = new EventEmitter<string>();

  @ViewChildren('otpCell') cells!: QueryList<ElementRef<HTMLInputElement>>;

  digits: string[] = Array(OTP_LENGTH).fill('');
  disabled = false;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  ngAfterViewInit(): void {
    if (this.autoFocus) {
      setTimeout(() => this.cells?.first?.nativeElement?.focus(), 100);
    }
  }

  writeValue(value: string): void {
    const chars = (value ?? '').split('').slice(0, this.length);
    this.digits = Array.from({ length: this.length }, (_, i) => chars[i] ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/\D/g, '').slice(-1);
    this.digits[index] = val;
    input.value = val;
    this.emitValue();

    if (val && index < this.length - 1) {
      this.cells.get(index + 1)?.nativeElement.focus();
    }
  }

  onKeyDown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !this.digits[index] && index > 0) {
      this.cells.get(index - 1)?.nativeElement.focus();
    }
    if (event.key === 'Enter') {
      const code = this.digits.join('');
      if (code.length === this.length) {
        this.completed.emit(code);
      }
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const paste =
      event.clipboardData?.getData('text')?.replace(/\D/g, '').slice(0, this.length) ?? '';
    paste.split('').forEach((char, i) => {
      this.digits[i] = char;
      const cell = this.cells.get(i);
      if (cell) cell.nativeElement.value = char;
    });
    this.emitValue();
    const focusIndex = Math.min(paste.length, this.length - 1);
    this.cells.get(focusIndex)?.nativeElement.focus();
  }

  private emitValue(): void {
    const code = this.digits.join('');
    this.onChange(code);
    this.onTouched();
    if (code.length === this.length) {
      this.completed.emit(code);
    }
  }
}
