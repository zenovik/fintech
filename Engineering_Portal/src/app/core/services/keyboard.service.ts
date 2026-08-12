import { Injectable, inject, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class KeyboardService implements OnDestroy {
  private readonly router = inject(Router);
  private readonly handler = (ev: KeyboardEvent) => {
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') {
      ev.preventDefault();
      void this.router.navigate(['/search']);
    }
  };

  constructor() {
    document.addEventListener('keydown', this.handler);
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.handler);
  }
}
