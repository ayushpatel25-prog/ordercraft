import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { OrdercraftDataService } from '../../core/services/ordercraft-data.service';
import { Subscription } from 'rxjs';

interface NavGroup {
  title: string;
  items: NavItem[];
}

interface NavItem {
  label: string;
  sublabel?: string;
  route: string;
  icon: string;
  roles?: string[];
  badgeKey?: 'pendingOrders' | 'lowStock' | 'workOrders';
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar-root" [class.collapsed]="collapsed">
      <div class="sidebar-nav">
        <ng-container *ngFor="let group of navGroups">
          <div *ngIf="isGroupVisible(group)" class="nav-group-wrapper">
            <div class="nav-section-title">{{ group.title }}</div>
            <div class="nav-group-items">
              <ng-container *ngFor="let item of group.items">
                <a *ngIf="isItemVisible(item)" 
                   [routerLink]="item.route" 
                   routerLinkActive="active" 
                   class="nav-link">
                  <span class="nav-icon" [innerHTML]="item.icon"></span>
                  <div class="nav-label-box">
                    <span class="nav-text">{{ item.label }}</span>
                  </div>
                  <span *ngIf="getItemBadge(item) as b" [class]="'nav-badge ' + b.type">
                    {{ b.text }}
                  </span>
                </a>
              </ng-container>
            </div>
          </div>
        </ng-container>
      </div>

      <div class="sidebar-footer">
        <div class="erp-status-box">
          <div class="pulse-indicator"></div>
          <div class="erp-info">
            <div class="erp-tenant-title">
              {{ authService.currentTenantValue?.code }} &bull; Live
            </div>
            <div class="erp-tenant-sub">
              {{ authService.currentTenantValue?.plantLocation }}
            </div>
          </div>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar-root {
      width: 255px;
      background: #ffffff;
      border-right: 1px solid rgba(226, 232, 240, 0.85);
      display: flex;
      flex-direction: column;
      height: calc(100vh - 64px);
      position: sticky;
      top: 64px;
      transition: width 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      overflow-y: auto;
      z-index: 40;
    }

    .sidebar-root.collapsed {
      width: 0;
      overflow: hidden;
      border-right: none;
    }

    @media (max-width: 1024px) {
      .sidebar-root {
        position: fixed;
        left: 0;
        bottom: 0;
        z-index: 60;
        box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.25);
      }
      .sidebar-root.collapsed {
        transform: translateX(-100%);
      }
    }

    .sidebar-nav {
      padding: 16px 10px;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .nav-group-wrapper {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .nav-section-title {
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      color: var(--slate-400);
      padding: 4px 12px 6px 12px;
      text-transform: uppercase;
    }

    .nav-group-items {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      border-radius: var(--radius-md);
      color: var(--slate-600);
      text-decoration: none;
      font-size: 0.8125rem;
      font-weight: 600;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
    }

    .nav-link:hover {
      background: rgba(241, 245, 249, 0.85);
      color: var(--slate-900);
      transform: translateX(3px);
    }

    .nav-link.active {
      background: linear-gradient(90deg, #eff6ff 0%, #f8fafc 100%);
      color: #1d4ed8;
      font-weight: 700;
      border-left: 3.5px solid #2563eb;
      padding-left: 8.5px;
      box-shadow: 0 2px 6px rgba(37, 99, 235, 0.08);
    }

    .nav-icon {
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: inherit;
      flex-shrink: 0;
    }

    .nav-label-box {
      flex: 1;
      display: flex;
      align-items: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .nav-text {
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .nav-badge {
      font-size: 0.62rem;
      font-weight: 800;
      padding: 1px 6px;
      border-radius: 9999px;
      line-height: 1.3;
    }

    .nav-badge.warning {
      background: #fef3c7;
      color: #b45309;
      border: 1px solid #fde68a;
    }

    .nav-badge.info {
      background: #e0f2fe;
      color: #0369a1;
      border: 1px solid #bae6fd;
    }

    .sidebar-footer {
      padding: 12px 14px;
      border-top: 1px solid rgba(226, 232, 240, 0.85);
      background: #fafbfc;
    }

    .erp-status-box {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 8px;
      border-radius: 8px;
      background: #ffffff;
      border: 1px solid var(--slate-200);
    }

    .pulse-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.25);
      flex-shrink: 0;
      animation: statusPulse 2s infinite ease-in-out;
    }

    @keyframes statusPulse {
      0%, 100% { box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.25); }
      50% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0.1); }
    }

    .erp-info {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .erp-tenant-title {
      font-weight: 700;
      font-size: 0.72rem;
      color: var(--slate-900);
      white-space: nowrap;
    }

    .erp-tenant-sub {
      font-size: 0.62rem;
      color: var(--slate-500);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `]
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() collapsed = false;

  private sub?: Subscription;
  summaryData: any = {};

  navGroups: NavGroup[] = [
    {
      title: 'COMMAND CENTER',
      items: [
        {
          label: 'Dashboard',
          route: '/dashboard',
          icon: '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>'
        },
        {
          label: 'Analytics & Reports (M11)',
          route: '/reports',
          icon: '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>'
        }
      ]
    },
    {
      title: 'SALES & COMMERCIAL',
      items: [
        {
          label: 'Customers (M2)',
          route: '/customers',
          icon: '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>',
          roles: ['SALES', 'SALES_EXECUTIVE', 'SALES_MANAGER', 'TENANT_ADMIN', 'ADMIN']
        },
        {
          label: 'Products & Pricing (M2)',
          route: '/products',
          icon: '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>'
        },
        {
          label: 'Sales Orders (M4)',
          route: '/orders',
          icon: '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>',
          roles: ['SALES', 'SALES_EXECUTIVE', 'SALES_MANAGER', 'TENANT_ADMIN', 'ADMIN', 'PRODUCTION_PLANNER'],
          badgeKey: 'pendingOrders'
        },
        {
          label: 'Dispatch & Delivery (M8)',
          route: '/dispatch',
          icon: '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13" rx="2"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>',
          roles: ['STORE_KEEPER', 'SALES_EXECUTIVE', 'TENANT_ADMIN', 'ADMIN']
        }
      ]
    },
    {
      title: 'MANUFACTURING & PLANT',
      items: [
        {
          label: 'Bill of Materials (M3)',
          route: '/bom',
          icon: '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>',
          roles: ['PRODUCTION_PLANNER', 'PRODUCTION_MANAGER', 'TENANT_ADMIN', 'ADMIN']
        },
        {
          label: 'Work Orders (M7)',
          route: '/work-orders',
          icon: '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>',
          roles: ['PRODUCTION_PLANNER', 'PRODUCTION_MANAGER', 'TENANT_ADMIN', 'ADMIN'],
          badgeKey: 'workOrders'
        },
        {
          label: 'Inventory Stock (M5)',
          route: '/inventory',
          icon: '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2 1.5 3 3.5 3h9c2 0 3.5-1 3.5-3V7c0-2-1.5-3-3.5-3h-9C5.5 4 4 5 4 7zm0 5h16"></path></svg>',
          badgeKey: 'lowStock'
        }
      ]
    },
    {
      title: 'SUPPLY CHAIN & SCM',
      items: [
        {
          label: 'Suppliers (M2)',
          route: '/suppliers',
          icon: '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>',
          roles: ['PROCUREMENT_OFFICER', 'TENANT_ADMIN', 'ADMIN']
        },
        {
          label: 'Purchase Orders (M6)',
          route: '/purchase-orders',
          icon: '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>',
          roles: ['PROCUREMENT_OFFICER', 'STORE_KEEPER', 'TENANT_ADMIN', 'ADMIN']
        },
        {
          label: '3-Way Matching (M6)',
          route: '/three-way-match',
          icon: '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
          roles: ['PROCUREMENT_OFFICER', 'FINANCE_USER', 'FINANCE_OFFICER', 'TENANT_ADMIN', 'ADMIN']
        }
      ]
    },
    {
      title: 'FINANCE & SETTLEMENT',
      items: [
        {
          label: 'Invoices & Tax (M9)',
          route: '/invoices',
          icon: '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>',
          roles: ['FINANCE_USER', 'FINANCE_OFFICER', 'TENANT_ADMIN', 'ADMIN', 'SALES_EXECUTIVE']
        },
        {
          label: 'Payments & AR Aging (M10)',
          route: '/payments',
          icon: '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>',
          roles: ['FINANCE_USER', 'FINANCE_OFFICER', 'TENANT_ADMIN', 'ADMIN']
        }
      ]
    },
    {
      title: 'GOVERNANCE & ADMIN',
      items: [
        {
          label: 'User Directory (M1)',
          route: '/users',
          icon: '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>',
          roles: ['TENANT_ADMIN', 'ADMIN', 'PLATFORM_ADMIN']
        },
        {
          label: 'Audit Trail (M12)',
          route: '/audit-logs',
          icon: '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
          roles: ['TENANT_ADMIN', 'ADMIN', 'PLATFORM_ADMIN']
        },
        {
          label: 'Tenant Settings (M1)',
          route: '/tenant-settings',
          icon: '<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path></svg>',
          roles: ['TENANT_ADMIN', 'ADMIN', 'PLATFORM_ADMIN']
        }
      ]
    }
  ];

  constructor(
    public authService: AuthService,
    private dataService: OrdercraftDataService
  ) {}

  ngOnInit(): void {
    this.refreshSummary();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  refreshSummary(): void {
    try {
      this.summaryData = this.dataService.getDashboardSummary();
    } catch (e) {
      this.summaryData = {};
    }
  }

  isGroupVisible(group: NavGroup): boolean {
    return group.items.some(item => this.isItemVisible(item));
  }

  isItemVisible(item: NavItem): boolean {
    if (!item.roles) return true;
    return this.authService.hasRole(item.roles);
  }

  getItemBadge(item: NavItem): { text: string; type: string } | null {
    if (item.badgeKey === 'pendingOrders' && this.summaryData?.pendingOrders > 0) {
      return { text: `${this.summaryData.pendingOrders}`, type: 'info' };
    }
    if (item.badgeKey === 'lowStock' && this.summaryData?.lowStockItems > 0) {
      return { text: `${this.summaryData.lowStockItems}`, type: 'warning' };
    }
    return null;
  }
}
