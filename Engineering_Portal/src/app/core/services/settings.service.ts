import { Injectable, signal, effect } from '@angular/core';

export type ThemeMode = 'light' | 'dark';
export type DensityMode = 'comfortable' | 'compact';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  readonly theme = signal<ThemeMode>((localStorage.getItem('ep-theme') as ThemeMode) ?? 'dark');
  readonly density = signal<DensityMode>((localStorage.getItem('ep-density') as DensityMode) ?? 'comfortable');
  readonly graphMaxNodes = signal(Number(localStorage.getItem('ep-graph-nodes') ?? 500));

  constructor() {
    effect(() => {
      const t = this.theme();
      document.body.classList.remove('light-theme', 'dark-theme');
      document.body.classList.add(t === 'dark' ? 'dark-theme' : 'light-theme');
      localStorage.setItem('ep-theme', t);
    });
    effect(() => {
      document.body.classList.toggle('compact-theme', this.density() === 'compact');
      localStorage.setItem('ep-density', this.density());
    });
    effect(() => localStorage.setItem('ep-graph-nodes', String(this.graphMaxNodes())));
  }

  toggleTheme(): void {
    this.theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }
}
