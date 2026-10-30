import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<ToastMessage[]>([]);
  public toasts$ = this.toastsSubject.asObservable();
  private nextId = 1;

  public show(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', durationMs = 4000): void {
    const id = this.nextId++;
    const current = this.toastsSubject.value;
    this.toastsSubject.next([...current, { id, type, message }]);

    setTimeout(() => {
      this.remove(id);
    }, durationMs);
  }

  public success(message: string): void {
    this.show(message, 'success');
  }

  public error(message: string): void {
    this.show(message, 'error', 6000);
  }

  public warning(message: string): void {
    this.show(message, 'warning', 5000);
  }

  public info(message: string): void {
    this.show(message, 'info');
  }

  public remove(id: number): void {
    const filtered = this.toastsSubject.value.filter(t => t.id !== id);
    this.toastsSubject.next(filtered);
  }
}
