import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

import { LoginComponent } from './pages/auth/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { CustomersComponent } from './pages/customers/customers.component';
import { ProductsComponent } from './pages/products/products.component';
import { OrdersComponent } from './pages/orders/orders.component';
import { BomComponent } from './pages/bom/bom.component';
import { InventoryComponent } from './pages/inventory/inventory.component';
import { WorkOrdersComponent } from './pages/work-orders/work-orders.component';
import { DispatchComponent } from './pages/dispatch/dispatch.component';
import { SuppliersComponent } from './pages/suppliers/suppliers.component';
import { PurchaseOrdersComponent } from './pages/purchase-orders/purchase-orders.component';
import { ThreeWayMatchComponent } from './pages/three-way-match/three-way-match.component';
import { InvoicesComponent } from './pages/invoices/invoices.component';
import { PaymentsComponent } from './pages/payments/payments.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { AuditLogsComponent } from './pages/audit-logs/audit-logs.component';
import { UsersComponent } from './pages/users/users.component';
import { TenantSettingsComponent } from './pages/tenant-settings/tenant-settings.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'customers',
    component: CustomersComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'TENANT_ADMIN', 'SALES', 'SALES_EXECUTIVE', 'SALES_MANAGER', 'FINANCE_USER', 'FINANCE_OFFICER'] }
  },
  {
    path: 'products',
    component: ProductsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'orders',
    component: OrdersComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'TENANT_ADMIN', 'SALES', 'SALES_EXECUTIVE', 'SALES_MANAGER', 'PRODUCTION_PLANNER', 'PRODUCTION_MANAGER', 'FINANCE_USER', 'FINANCE_OFFICER'] }
  },
  {
    path: 'bom',
    component: BomComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'TENANT_ADMIN', 'PRODUCTION_PLANNER', 'PRODUCTION_MANAGER', 'SALES_EXECUTIVE', 'PROCUREMENT_OFFICER'] }
  },
  {
    path: 'inventory',
    component: InventoryComponent,
    canActivate: [authGuard]
  },
  {
    path: 'work-orders',
    component: WorkOrdersComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'TENANT_ADMIN', 'PRODUCTION_PLANNER', 'PRODUCTION_MANAGER', 'STORE_KEEPER'] }
  },
  {
    path: 'dispatch',
    component: DispatchComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'TENANT_ADMIN', 'STORE_KEEPER', 'SALES_EXECUTIVE', 'SALES_MANAGER'] }
  },
  {
    path: 'suppliers',
    component: SuppliersComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'TENANT_ADMIN', 'PROCUREMENT_OFFICER'] }
  },
  {
    path: 'purchase-orders',
    component: PurchaseOrdersComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'TENANT_ADMIN', 'PROCUREMENT_OFFICER', 'STORE_KEEPER', 'FINANCE_USER', 'FINANCE_OFFICER'] }
  },
  {
    path: 'three-way-match',
    component: ThreeWayMatchComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'TENANT_ADMIN', 'PROCUREMENT_OFFICER', 'FINANCE_USER', 'FINANCE_OFFICER'] }
  },
  {
    path: 'invoices',
    component: InvoicesComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'TENANT_ADMIN', 'FINANCE_USER', 'FINANCE_OFFICER', 'SALES_EXECUTIVE', 'SALES_MANAGER'] }
  },
  {
    path: 'payments',
    component: PaymentsComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'TENANT_ADMIN', 'FINANCE_USER', 'FINANCE_OFFICER'] }
  },
  {
    path: 'reports',
    component: ReportsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'audit-logs',
    component: AuditLogsComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'TENANT_ADMIN', 'PLATFORM_ADMIN'] }
  },
  {
    path: 'users',
    component: UsersComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'TENANT_ADMIN', 'PLATFORM_ADMIN'] }
  },
  {
    path: 'tenant-settings',
    component: TenantSettingsComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'TENANT_ADMIN', 'PLATFORM_ADMIN'] }
  },
  { path: '**', redirectTo: 'dashboard' }
];
