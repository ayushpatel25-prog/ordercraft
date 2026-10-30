import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" *ngIf="(toastService.toasts$ | async) as toasts">
      <div *ngFor="let toast of toasts" 
           class="toast-item" 
           [ngClass]="'toast-' + toast.type">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span *ngIf="toast.type === 'success'" style="color: var(--success); font-weight: bold;">✓</span>
          <span *ngIf="toast.type === 'error'" style="color: var(--danger); font-weight: bold;">✕</span>
          <span *ngIf="toast.type === 'warning'" style="color: var(--warning); font-weight: bold;">⚠</span>
          <span *ngIf="toast.type === 'info'" style="color: var(--info); font-weight: bold;">ℹ</span>
          <span>{{ toast.message }}</span>
        </div>
        <button (click)="toastService.remove(toast.id)" 
                style="background: transparent; border: none; font-size: 1.1rem; cursor: pointer; color: var(--slate-400);">
          &times;
        </button>
      </div>
    </div>
  `
})
export class ToastContainerComponent {
  constructor(public toastService: ToastService) {}
}
