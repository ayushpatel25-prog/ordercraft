import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { AuthResponse, EnterpriseRole, Tenant, UserRole } from '../models/models';

export interface UserSession {
  id: number;
  tenantId: number;
  name: string;
  email: string;
  role: EnterpriseRole;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // Seed Tenants
  public readonly TENANTS: Tenant[] = [
    {
      id: 1,
      publicId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      code: 'APEX_MFG',
      name: 'Apex Precision Mfg Pvt Ltd',
      plan: 'ENTERPRISE',
      status: 'ACTIVE',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      currencySymbol: '₹',
      plantLocation: 'Pune, Maharashtra (India)',
      settings: {
        approvalThreshold: 500000,
        maxDiscountPct: 15,
        taxRegime: 'GST_IN (18%)',
        fiscalYear: 'FY2026-27',
        lockoutThreshold: 5
      }
    },
    {
      id: 2,
      publicId: '7cb92e15-8428-4981-a1ab-5e821b55bed7',
      code: 'ZENITH_IND',
      name: 'Zenith Industrial Systems Pvt Ltd',
      plan: 'ENTERPRISE',
      status: 'ACTIVE',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      currencySymbol: '₹',
      plantLocation: 'Bengaluru, Karnataka (India)',
      settings: {
        approvalThreshold: 500000,
        maxDiscountPct: 15,
        taxRegime: 'GST_IN (18%)',
        fiscalYear: 'FY2026-27',
        lockoutThreshold: 5
      }
    }
  ];

  private currentTenantSubject = new BehaviorSubject<Tenant>(this.TENANTS[0]);
  public currentTenant$ = this.currentTenantSubject.asObservable();

  private currentUserSubject = new BehaviorSubject<UserSession | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Demo user catalog for all enterprise roles across tenants
  public readonly DEMO_USERS: Record<EnterpriseRole, UserSession> = {
    TENANT_ADMIN: {
      id: 1,
      tenantId: 1,
      name: 'Rajesh Sharma',
      email: 'admin@apex.com',
      role: 'TENANT_ADMIN',
      token: 'mock-jwt-tenant-admin'
    },
    SALES_EXECUTIVE: {
      id: 2,
      tenantId: 1,
      name: 'Ayush Patel',
      email: 'sales@apex.com',
      role: 'SALES_EXECUTIVE',
      token: 'mock-jwt-sales-exec'
    },
    SALES_MANAGER: {
      id: 3,
      tenantId: 1,
      name: 'Meera Deshmukh',
      email: 'salesmgr@apex.com',
      role: 'SALES_MANAGER',
      token: 'mock-jwt-sales-mgr'
    },
    PRODUCTION_PLANNER: {
      id: 4,
      tenantId: 1,
      name: 'Vikram Rao',
      email: 'planner@apex.com',
      role: 'PRODUCTION_PLANNER',
      token: 'mock-jwt-planner'
    },
    PROCUREMENT_OFFICER: {
      id: 5,
      tenantId: 1,
      name: 'Sunita Joshi',
      email: 'procurement@apex.com',
      role: 'PROCUREMENT_OFFICER',
      token: 'mock-jwt-proc'
    },
    STORE_KEEPER: {
      id: 6,
      tenantId: 1,
      name: 'Karan Varma',
      email: 'store@apex.com',
      role: 'STORE_KEEPER',
      token: 'mock-jwt-store'
    },
    FINANCE_USER: {
      id: 7,
      tenantId: 1,
      name: 'Naveen Goyal',
      email: 'finance@apex.com',
      role: 'FINANCE_USER',
      token: 'mock-jwt-fin'
    },
    VIEWER: {
      id: 8,
      tenantId: 1,
      name: 'Ananya Roy',
      email: 'viewer@apex.com',
      role: 'VIEWER',
      token: 'mock-jwt-viewer'
    },
    PLATFORM_ADMIN: {
      id: 99,
      tenantId: 1,
      name: 'Global Platform Admin',
      email: 'platform@ordercraft.com',
      role: 'PLATFORM_ADMIN',
      token: 'mock-jwt-platform-admin'
    }
  };

  private failedLoginAttempts = 0;
  private lockedUntil: Date | null = null;

  constructor() {
    const savedTenantId = localStorage.getItem('ordercraft_tenant_id');
    if (savedTenantId) {
      const found = this.TENANTS.find(t => t.id === Number(savedTenantId));
      if (found) this.currentTenantSubject.next(found);
    }

    const savedUser = localStorage.getItem('ordercraft_user');
    if (savedUser) {
      try {
        this.currentUserSubject.next(JSON.parse(savedUser));
      } catch {
        this.switchRole('TENANT_ADMIN');
      }
    } else {
      this.switchRole('TENANT_ADMIN');
    }
  }

  public get currentTenantValue(): Tenant {
    return this.currentTenantSubject.value;
  }

  public get currentUserValue(): UserSession | null {
    return this.currentUserSubject.value;
  }

  public get currentRole(): EnterpriseRole {
    return this.currentUserValue?.role || 'TENANT_ADMIN';
  }

  public get currencySymbol(): string {
    return this.currentTenantValue?.currencySymbol || '₹';
  }

  public isAuthenticated(): boolean {
    return !!this.currentUserValue;
  }

  public hasRole(roles: string[] | string): boolean {
    if (!this.currentUserValue) return false;
    const current = this.currentUserValue.role;
    if (current === 'PLATFORM_ADMIN' || current === 'TENANT_ADMIN') return true;

    const allowed = Array.isArray(roles) ? roles : [roles];
    // Map backwards compatible role names
    return allowed.some(r => {
      if (r === 'SALES' && (current === 'SALES_EXECUTIVE' || current === 'SALES_MANAGER')) return true;
      if (r === 'PRODUCTION_MANAGER' && current === 'PRODUCTION_PLANNER') return true;
      if (r === 'FINANCE_OFFICER' && current === 'FINANCE_USER') return true;
      return r === (current as string);
    });
  }

  public switchTenant(tenantId: number): void {
    const tenant = this.TENANTS.find(t => t.id === tenantId);
    if (tenant) {
      this.currentTenantSubject.next(tenant);
      localStorage.setItem('ordercraft_tenant_id', String(tenant.id));

      // Keep user in current role but bind to switched tenant
      if (this.currentUserValue) {
        const updatedUser: UserSession = {
          ...this.currentUserValue,
          tenantId: tenant.id
        };
        this.currentUserSubject.next(updatedUser);
        localStorage.setItem('ordercraft_user', JSON.stringify(updatedUser));
      }
    }
  }

  public switchRole(role: EnterpriseRole | string): void {
    // Map legacy names if passed
    let mappedRole: EnterpriseRole = 'TENANT_ADMIN';
    if (role === 'ADMIN') mappedRole = 'TENANT_ADMIN';
    else if (role === 'SALES') mappedRole = 'SALES_EXECUTIVE';
    else if (role === 'PRODUCTION_MANAGER') mappedRole = 'PRODUCTION_PLANNER';
    else if (role === 'FINANCE_OFFICER') mappedRole = 'FINANCE_USER';
    else mappedRole = role as EnterpriseRole;

    const baseUser = this.DEMO_USERS[mappedRole] || this.DEMO_USERS['TENANT_ADMIN'];
    const sessionUser: UserSession = {
      ...baseUser,
      tenantId: this.currentTenantValue.id
    };

    localStorage.setItem('ordercraft_user', JSON.stringify(sessionUser));
    localStorage.setItem('ordercraft_token', sessionUser.token);
    this.currentUserSubject.next(sessionUser);
  }

  public login(email: string, password: string): Observable<AuthResponse> {
    // Lockout check
    if (this.lockedUntil && new Date() < this.lockedUntil) {
      const waitMinutes = Math.ceil((this.lockedUntil.getTime() - Date.now()) / 60000);
      throw new Error(`Account is locked due to 5 consecutive failed attempts. Please retry in ${waitMinutes} minute(s).`);
    }

    if (password !== 'Password@123') {
      this.failedLoginAttempts++;
      if (this.failedLoginAttempts >= 5) {
        this.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
        throw new Error('Account locked for 15 minutes due to 5 failed login attempts.');
      }
      throw new Error(`Invalid credentials. Attempt ${this.failedLoginAttempts} of 5.`);
    }

    this.failedLoginAttempts = 0;
    this.lockedUntil = null;

    let matchedRole: EnterpriseRole = 'TENANT_ADMIN';
    if (email.includes('salesmgr')) matchedRole = 'SALES_MANAGER';
    else if (email.includes('sales')) matchedRole = 'SALES_EXECUTIVE';
    else if (email.includes('planner') || email.includes('production')) matchedRole = 'PRODUCTION_PLANNER';
    else if (email.includes('procurement')) matchedRole = 'PROCUREMENT_OFFICER';
    else if (email.includes('store')) matchedRole = 'STORE_KEEPER';
    else if (email.includes('finance')) matchedRole = 'FINANCE_USER';
    else if (email.includes('viewer')) matchedRole = 'VIEWER';
    else if (email.includes('platform')) matchedRole = 'PLATFORM_ADMIN';

    this.switchRole(matchedRole);

    return of({
      token: this.currentUserValue!.token,
      tokenType: 'Bearer',
      id: this.currentUserValue!.id,
      tenantId: this.currentTenantValue.id,
      name: this.currentUserValue!.name,
      email: this.currentUserValue!.email,
      roles: [this.currentUserValue!.role],
      permissions: ['ALL']
    });
  }

  public logout(): void {
    localStorage.removeItem('ordercraft_user');
    localStorage.removeItem('ordercraft_token');
    this.currentUserSubject.next(null);
  }
}
