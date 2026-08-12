import { Injectable, signal } from '@angular/core';

export interface Bookmark {
  id: string;
  label: string;
  route: string;
}

@Injectable({ providedIn: 'root' })
export class BookmarkService {
  readonly favorites = signal<Bookmark[]>(this.load());

  toggle(item: Bookmark): void {
    const exists = this.favorites().some((f) => f.id === item.id);
    const next = exists ? this.favorites().filter((f) => f.id !== item.id) : [...this.favorites(), item];
    this.favorites.set(next);
    localStorage.setItem('ep-favorites', JSON.stringify(next));
  }

  isFavorite(id: string): boolean {
    return this.favorites().some((f) => f.id === id);
  }

  private load(): Bookmark[] {
    try {
      return JSON.parse(localStorage.getItem('ep-favorites') ?? '[]');
    } catch {
      return [];
    }
  }
}
