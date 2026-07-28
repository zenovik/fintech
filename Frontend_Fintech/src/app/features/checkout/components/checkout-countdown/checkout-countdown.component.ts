import { Component, input, signal, OnInit, OnDestroy, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-checkout-countdown',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="co-countdown" [class.co-countdown--urgent]="remaining() < 120">
      <span class="material-symbols-outlined">schedule</span>
      <span>Session expires in {{ display() }}</span>
    </div>
  `,
  styles: [`
    .co-countdown {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 13px; color: #64748b; padding: 8px 12px;
      background: #f8fafc; border-radius: 8px;
    }
    .co-countdown--urgent { color: #b42318; background: #fef3f2; }
    .material-symbols-outlined { font-size: 18px; }
  `],
})
export class CheckoutCountdownComponent implements OnInit, OnDestroy {
  readonly expiresAt = input.required<string>();
  readonly expired = output<void>();

  readonly remaining = signal(0);
  readonly display = signal('30:00');
  private timer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.tick();
    this.timer = setInterval(() => this.tick(), 1000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private tick(): void {
    const diff = Math.max(0, Math.floor((new Date(this.expiresAt()).getTime() - Date.now()) / 1000));
    this.remaining.set(diff);
    const m = Math.floor(diff / 60);
    const s = diff % 60;
    this.display.set(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    if (diff === 0) this.expired.emit();
  }
}
