import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar.component';
import { SidebarComponent } from './shared/components/sidebar.component';
import { ToastContainerComponent } from './shared/components/toast-container.component';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NavbarComponent,
    SidebarComponent,
    ToastContainerComponent
  ],
  template: `
    <app-toast-container></app-toast-container>

    <div *ngIf="isAuthPage()" class="auth-wrapper">
      <router-outlet></router-outlet>
    </div>

    <div *ngIf="!isAuthPage()" class="app-layout">
      <app-navbar (toggleSidebar)="sidebarCollapsed = !sidebarCollapsed"></app-navbar>
      
      <div class="main-container">
        <app-sidebar [collapsed]="sidebarCollapsed"></app-sidebar>
        
        <main class="content-area">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .app-layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .main-container {
      display: flex;
      flex: 1;
      position: relative;
    }

    .content-area {
      flex: 1;
      padding: 24px 32px 48px 32px;
      background: transparent;
      overflow-y: auto;
      max-width: 1680px;
      margin: 0 auto;
      width: 100%;
    }

    @media (max-width: 768px) {
      .content-area {
        padding: 16px 16px 36px 16px;
      }
    }

    .auth-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
    }
  `]
})
export class AppComponent {
  sidebarCollapsed = false;

  constructor(private router: Router, public authService: AuthService) {}

  isAuthPage(): boolean {
    const url = this.router.url;
    return url.includes('/login') || url.includes('/register') || url.includes('/forgot-password');
  }
}
