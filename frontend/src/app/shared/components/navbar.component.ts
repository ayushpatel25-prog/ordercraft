import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { OrdercraftDataService } from '../../core/services/ordercraft-data.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="navbar-root">
      <div class="navbar-left">
        <button class="menu-toggle-btn" (click)="toggleSidebar.emit()" title="Toggle Sidebar">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>

        <div class="brand-container" (click)="navigate('/dashboard')">
          <div class="brand-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
          </div>
          <div class="brand-text">
            <div class="brand-title-wrap">
              <span class="brand-title">ORDER<span class="brand-gradient">CRAFT</span></span>
              <span class="brand-badge-v1">ENTERPRISE</span>
            </div>
            <span class="brand-tag">MANUFACTURING OMS &bull; REAL-TIME CLOUD</span>
          </div>
        </div>
      </div>

      <div class="navbar-center">
        <div class="search-box">
          <svg class="search-icon" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <input type="text" 
                 [(ngModel)]="searchQuery"
                 (ngModelChange)="onSearchChange($event)"
                 (focus)="showSearchResults = searchResults.length > 0"
                 placeholder="Search orders, SKU, BOM, customers, ledger..." 
                 class="search-input" />
          <div class="search-shortcut">
            <kbd>Ctrl</kbd><kbd>K</kbd>
          </div>

          <!-- Instant Search Dropdown Popover -->
          <div *ngIf="showSearchResults && searchResults.length > 0" class="search-results-dropdown">
            <div class="search-results-header">
              <span>Quick Matching Records ({{ searchResults.length }})</span>
              <button class="close-search-btn" (click)="clearSearch()">&times;</button>
            </div>
            <div class="search-results-list">
              <div *ngFor="let res of searchResults" 
                   class="search-result-item" 
                   (click)="goToResult(res)">
                <div class="search-type-tag" [ngClass]="'tag-' + res.type.toLowerCase()">{{ res.type }}</div>
                <div class="search-item-info">
                  <div class="search-item-title">{{ res.title }}</div>
                  <div class="search-item-subtitle">{{ res.subtitle }}</div>
                </div>
                <span class="badge badge-neutral" style="font-size: 0.65rem;">{{ res.badge }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="navbar-right">
        <!-- Live Multi-Tenant Selector Switcher -->
        <div class="tenant-selector-pill" title="Active Tenant Context (Multi-Tenant Shared Schema)">
          <div class="tenant-flag-icon">
            <span>🇮🇳</span>
          </div>
          <div class="tenant-info-box">
            <span class="tenant-label">TENANT</span>
            <select [ngModel]="authService.currentTenantValue?.id" 
                    (ngModelChange)="onTenantChange($event)"
                    class="tenant-select">
              <option *ngFor="let t of authService.TENANTS" [value]="t.id">
                {{ t.name }} ({{ t.currencySymbol }})
              </option>
            </select>
          </div>
        </div>

        <!-- Live Enterprise Role Switcher -->
        <div class="role-selector-pill" [ngClass]="getRolePillClass(authService.currentRole)">
          <div class="role-dot"></div>
          <div class="role-info-box">
            <span class="role-label">ROLE</span>
            <select [ngModel]="authService.currentRole" 
                    (ngModelChange)="onRoleChange($event)"
                    class="role-select">
              <option value="TENANT_ADMIN">Tenant Admin</option>
              <option value="SALES_EXECUTIVE">Sales Executive</option>
              <option value="SALES_MANAGER">Sales Manager</option>
              <option value="PRODUCTION_PLANNER">Production Planner</option>
              <option value="PROCUREMENT_OFFICER">Procurement Officer</option>
              <option value="STORE_KEEPER">Store Keeper</option>
              <option value="FINANCE_USER">Finance User</option>
              <option value="VIEWER">Read-Only Viewer</option>
            </select>
          </div>
        </div>

        <!-- Notification Bell Dropdown -->
        <div class="notif-wrapper">
          <button class="icon-btn" (click)="toggleNotifications()" title="Notifications">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
            </svg>
            <span *ngIf="unreadCount > 0" class="notif-badge">{{ unreadCount }}</span>
          </button>

          <!-- Notifications Popover -->
          <div *ngIf="showNotifications" class="notif-popover">
            <div class="notif-header">
              <div class="flex items-center gap-2">
                <span style="font-weight: 700; font-size: 0.88rem; color: var(--slate-900);">System Notifications</span>
                <span *ngIf="unreadCount > 0" class="badge badge-info" style="font-size: 0.65rem; padding: 1px 6px;">{{ unreadCount }} new</span>
              </div>
              <button class="btn btn-sm btn-secondary" (click)="markAllRead()">Mark all read</button>
            </div>
            <div class="notif-list">
              <div *ngFor="let n of notifications" 
                   class="notif-item" 
                   [class.unread]="!n.isRead"
                   (click)="markAsRead(n.id)">
                <div class="notif-icon-dot" [ngClass]="'dot-' + n.type.toLowerCase()"></div>
                <div class="notif-content">
                  <div class="notif-title">{{ n.title }}</div>
                  <div class="notif-msg">{{ n.message }}</div>
                  <div class="notif-time">{{ n.createdAt | date:'shortTime' }}</div>
                </div>
              </div>
              <div *ngIf="notifications.length === 0" style="padding: 32px 20px; text-align: center; color: var(--slate-400); font-size: 0.84rem;">
                No unread notifications
              </div>
            </div>
          </div>
        </div>

        <div class="divider-v"></div>

        <!-- User profile -->
        <div class="user-profile">
          <div class="user-avatar">
            {{ getUserInitials() }}
            <span class="status-indicator"></span>
          </div>
          <div class="user-info">
            <span class="user-name">{{ authService.currentUserValue?.name }}</span>
            <span class="user-role">{{ formatRole(authService.currentUserValue?.role) }}</span>
          </div>
          <button class="logout-btn" title="Sign Out" (click)="logout()">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
          </button>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .navbar-root {
      height: 64px;
      background: rgba(255, 255, 255, 0.94);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid rgba(226, 232, 240, 0.85);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      position: sticky;
      top: 0;
      z-index: 50;
      box-shadow: 0 2px 10px -2px rgba(15, 23, 42, 0.05);
    }

    .navbar-left, .navbar-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .menu-toggle-btn {
      display: none;
      background: transparent;
      border: 1px solid var(--slate-200);
      color: var(--slate-600);
      cursor: pointer;
      padding: 7px;
      border-radius: 8px;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }

    .menu-toggle-btn:hover {
      background: var(--slate-100);
      color: var(--slate-900);
    }

    @media (max-width: 1024px) {
      .menu-toggle-btn { display: flex; }
    }

    .brand-container {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      user-select: none;
    }

    .brand-icon {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #4f46e5 100%);
      color: #ffffff;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
    }

    .brand-icon::after {
      content: '';
      position: absolute;
      inset: -1px;
      border-radius: 13px;
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.4), transparent);
      pointer-events: none;
    }

    .brand-container:hover .brand-icon {
      transform: translateY(-1px) scale(1.05);
      box-shadow: 0 6px 18px rgba(37, 99, 235, 0.45);
    }

    .brand-text {
      display: flex;
      flex-direction: column;
    }

    .brand-title-wrap {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .brand-title {
      font-size: 1.25rem;
      font-weight: 800;
      letter-spacing: -0.035em;
      color: var(--slate-950);
      line-height: 1.1;
    }

    .brand-gradient {
      background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .brand-badge-v1 {
      font-size: 0.6rem;
      font-weight: 800;
      color: #ffffff;
      background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
      padding: 1px 6px;
      border-radius: 999px;
      letter-spacing: 0.05em;
      box-shadow: 0 1px 4px rgba(37, 99, 235, 0.3);
    }

    .brand-tag {
      font-size: 0.62rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: var(--slate-400);
      margin-top: 1px;
    }

    .navbar-center {
      flex: 1;
      max-width: 420px;
      margin: 0 20px;
    }

    @media (max-width: 960px) {
      .navbar-center { display: none; }
    }

    .search-box {
      position: relative;
      width: 100%;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 14px;
      color: var(--slate-400);
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      padding: 8px 60px 8px 38px;
      border-radius: 9999px;
      border: 1px solid var(--slate-200);
      background: var(--slate-50);
      font-size: 0.8125rem;
      font-family: inherit;
      color: var(--slate-800);
      outline: none;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .search-input:focus {
      background: #ffffff;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px var(--primary-glow);
    }

    .search-shortcut {
      position: absolute;
      right: 10px;
      display: flex;
      gap: 3px;
      pointer-events: none;
    }

    .search-shortcut kbd {
      background: var(--slate-200);
      color: var(--slate-600);
      font-size: 0.65rem;
      font-weight: 600;
      padding: 2px 5px;
      border-radius: 4px;
      font-family: var(--font-mono);
    }

    .search-results-dropdown {
      position: absolute;
      top: 45px;
      left: 0;
      right: 0;
      background: #ffffff;
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      border: 1px solid var(--slate-200);
      z-index: 1000;
      animation: modalSlideUp 0.15s ease-out;
      overflow: hidden;
    }

    .search-results-header {
      padding: 8px 12px;
      background: var(--slate-50);
      border-bottom: 1px solid var(--slate-200);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--slate-500);
    }

    .close-search-btn {
      background: none;
      border: none;
      font-size: 1.1rem;
      color: var(--slate-400);
      cursor: pointer;
      line-height: 1;
    }

    .search-results-list {
      max-height: 320px;
      overflow-y: auto;
    }

    .search-result-item {
      padding: 10px 14px;
      border-bottom: 1px solid var(--slate-100);
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .search-result-item:hover {
      background: #eff6ff;
    }

    .search-type-tag {
      font-size: 0.6rem;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      letter-spacing: 0.05em;
      flex-shrink: 0;
    }

    .tag-order { background: #dbeafe; color: #1e40af; }
    .tag-product { background: #e0e7ff; color: #3730a3; }
    .tag-customer { background: #fef3c7; color: #92400e; }
    .tag-work_order { background: #dcfce7; color: #166534; }

    .search-item-info {
      flex: 1;
      overflow: hidden;
    }

    .search-item-title {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--slate-900);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .search-item-subtitle {
      font-size: 0.7rem;
      color: var(--slate-500);
      margin-top: 1px;
    }

    /* Tenant Selector Pill */
    .tenant-selector-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #ffffff;
      padding: 4px 12px;
      border-radius: 9999px;
      border: 1px solid var(--slate-200);
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
      transition: all 0.2s ease;
    }

    .tenant-selector-pill:hover {
      border-color: var(--primary-border);
      background: #fafbfc;
    }

    .tenant-flag-icon {
      font-size: 1rem;
      line-height: 1;
    }

    .tenant-info-box {
      display: flex;
      flex-direction: column;
    }

    .tenant-label {
      font-size: 0.58rem;
      font-weight: 800;
      color: var(--slate-400);
      letter-spacing: 0.06em;
      line-height: 1;
    }

    .tenant-select {
      background: transparent;
      border: none;
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--slate-900);
      cursor: pointer;
      outline: none;
      font-family: inherit;
      padding: 0;
    }

    /* Role Selector Pill */
    .role-selector-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 12px;
      border-radius: 9999px;
      border: 1px solid var(--slate-200);
      background: #ffffff;
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
      transition: all 0.2s ease;
    }

    .role-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--primary);
    }

    .role-info-box {
      display: flex;
      flex-direction: column;
    }

    .role-label {
      font-size: 0.58rem;
      font-weight: 800;
      color: var(--slate-400);
      letter-spacing: 0.06em;
      line-height: 1;
    }

    .role-select {
      background: transparent;
      border: none;
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--slate-900);
      cursor: pointer;
      outline: none;
      font-family: inherit;
      padding: 0;
    }

    .role-admin .role-dot { background: #7c3aed; }
    .role-sales .role-dot { background: #2563eb; }
    .role-prod .role-dot { background: #f59e0b; }
    .role-proc .role-dot { background: #06b6d4; }
    .role-fin .role-dot { background: #10b981; }

    .divider-v {
      width: 1px;
      height: 28px;
      background: var(--slate-200);
      margin: 0 4px;
    }

    .notif-wrapper {
      position: relative;
    }

    .icon-btn {
      position: relative;
      background: transparent;
      border: 1px solid transparent;
      color: var(--slate-600);
      cursor: pointer;
      padding: 8px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }

    .icon-btn:hover {
      background: var(--slate-100);
      color: var(--slate-900);
    }

    .notif-badge {
      position: absolute;
      top: 4px;
      right: 4px;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: #ffffff;
      font-size: 0.62rem;
      font-weight: 800;
      border-radius: 9999px;
      padding: 1px 5px;
      box-shadow: 0 0 6px rgba(239, 68, 68, 0.4);
    }

    .notif-popover {
      position: absolute;
      top: 48px;
      right: -80px;
      width: 380px;
      max-height: 440px;
      overflow-y: auto;
      z-index: 100;
      background: #ffffff;
      border-radius: var(--radius-lg);
      border: 1px solid var(--slate-200);
      box-shadow: var(--shadow-lg), 0 0 0 1px rgba(15, 23, 42, 0.05);
      animation: modalSlideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .notif-header {
      padding: 14px 18px;
      border-bottom: 1px solid var(--slate-150);
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #fafbfc;
      border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    }

    .notif-list {
      display: flex;
      flex-direction: column;
    }

    .notif-item {
      padding: 13px 18px;
      border-bottom: 1px solid var(--slate-150);
      display: flex;
      gap: 12px;
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .notif-item:hover {
      background: var(--slate-50);
    }

    .notif-item.unread {
      background: #f8fafc;
      border-left: 3px solid var(--primary);
    }

    .notif-icon-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-top: 6px;
      flex-shrink: 0;
    }

    .dot-info { background: #3b82f6; }
    .dot-success { background: #10b981; }
    .dot-warning { background: #f59e0b; }
    .dot-alert { background: #ef4444; }

    .notif-title {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--slate-900);
    }

    .notif-msg {
      font-size: 0.75rem;
      color: var(--slate-600);
      margin-top: 2px;
      line-height: 1.4;
    }

    .notif-time {
      font-size: 0.65rem;
      color: var(--slate-400);
      margin-top: 4px;
    }

    .user-profile {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #0f172a 0%, #334155 100%);
      color: #ffffff;
      font-size: 0.78rem;
      font-weight: 800;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      box-shadow: 0 2px 5px rgba(15, 23, 42, 0.2);
    }

    .status-indicator {
      position: absolute;
      bottom: -1px;
      right: -1px;
      width: 9px;
      height: 9px;
      background: #10b981;
      border: 2px solid #ffffff;
      border-radius: 50%;
    }

    .user-info {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--slate-900);
      line-height: 1.1;
    }

    .user-role {
      font-size: 0.65rem;
      font-weight: 600;
      color: var(--slate-500);
      margin-top: 2px;
    }

    .logout-btn {
      background: transparent;
      border: 1px solid transparent;
      color: var(--slate-400);
      cursor: pointer;
      padding: 6px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }

    .logout-btn:hover {
      background: var(--danger-light);
      color: var(--danger);
      border-color: var(--danger-border);
    }
  `]
})
export class NavbarComponent {
  @Output() toggleSidebar = new EventEmitter<void>();

  showNotifications = false;
  notifications: any[] = [];
  unreadCount = 0;

  searchQuery = '';
  searchResults: any[] = [];
  showSearchResults = false;

  constructor(
    public authService: AuthService,
    private dataService: OrdercraftDataService,
    private router: Router
  ) {
    this.dataService.notifications$.subscribe(list => {
      this.notifications = list;
      this.unreadCount = list.filter(n => !n.isRead).length;
    });
  }

  getUserInitials(): string {
    const name = this.authService.currentUserValue?.name || 'AD';
    const parts = name.split(' ');
    return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
  }

  formatRole(role?: string): string {
    if (!role) return 'User';
    return role.replace(/_/g, ' ');
  }

  getRolePillClass(role: string): string {
    if (role.includes('ADMIN')) return 'role-admin';
    if (role.includes('SALES')) return 'role-sales';
    if (role.includes('PROD')) return 'role-prod';
    if (role.includes('PROC') || role.includes('STORE')) return 'role-proc';
    if (role.includes('FIN')) return 'role-fin';
    return '';
  }

  onTenantChange(tenantId: any): void {
    this.authService.switchTenant(Number(tenantId));
  }

  onRoleChange(role: any): void {
    this.authService.switchRole(role);
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  markAsRead(id: number): void {
    this.dataService.markNotificationAsRead(id);
  }

  markAllRead(): void {
    this.notifications.forEach(n => this.dataService.markNotificationAsRead(n.id));
  }

  onSearchChange(query: string): void {
    if (!query || query.trim().length < 2) {
      this.searchResults = [];
      this.showSearchResults = false;
      return;
    }
    this.searchResults = this.dataService.searchGlobal(query);
    this.showSearchResults = true;
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchResults = [];
    this.showSearchResults = false;
  }

  goToResult(result: any): void {
    this.clearSearch();
    this.router.navigate([result.route]);
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
