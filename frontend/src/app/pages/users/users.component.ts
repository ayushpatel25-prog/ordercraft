import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrdercraftDataService } from '../../core/services/ordercraft-data.service';
import { ToastService } from '../../core/services/toast.service';
import { User } from '../../core/models/models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header flex-between mb-4">
        <div>
          <h1 class="page-title">User & Role Administration</h1>
          <p class="text-secondary text-sm">Manage enterprise staff accounts, role-based authorization, and security status</p>
        </div>
        <button class="btn btn-primary flex-center gap-1" (click)="openAddUserModal()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Staff Member
        </button>
      </div>

      <!-- User Stats Cards -->
      <div class="grid grid-4 mb-4">
        <div class="card p-3">
          <span class="text-secondary text-xs font-semibold">TOTAL USERS</span>
          <h2 class="mt-1 font-bold">{{ users.length }}</h2>
        </div>
        <div class="card p-3">
          <span class="text-secondary text-xs font-semibold">ACTIVE ACCOUNTS</span>
          <h2 class="mt-1 font-bold text-success">{{ getActiveCount() }}</h2>
        </div>
        <div class="card p-3">
          <span class="text-secondary text-xs font-semibold">ADMINISTRATORS</span>
          <h2 class="mt-1 font-bold text-primary">{{ getRoleCount('ADMIN') }}</h2>
        </div>
        <div class="card p-3">
          <span class="text-secondary text-xs font-semibold">DEPARTMENTAL LEADS</span>
          <h2 class="mt-1 font-bold text-warning">{{ users.length - getRoleCount('ADMIN') }}</h2>
        </div>
      </div>

      <!-- User Table -->
      <div class="card p-0 mb-4">
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>User ID</th>
                <th>Employee Name</th>
                <th>Work Email</th>
                <th>Assigned Roles</th>
                <th>Account Status</th>
                <th>Created Date</th>
                <th style="width: 140px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let user of users">
                <td class="text-secondary font-mono">#{{ user.id }}</td>
                <td>
                  <div class="font-bold">{{ user.name }}</div>
                </td>
                <td class="font-mono text-sm">{{ user.email }}</td>
                <td>
                  <div class="flex-wrap gap-1">
                    <span *ngFor="let role of user.roles" class="badge" [ngClass]="getRoleBadgeClass(role)">
                      {{ role }}
                    </span>
                  </div>
                </td>
                <td>
                  <span class="badge" [ngClass]="user.isActive ? 'badge-success' : 'badge-danger'">
                    {{ user.isActive ? 'ACTIVE' : 'SUSPENDED' }}
                  </span>
                </td>
                <td class="text-xs text-secondary">{{ user.createdAt | date:'mediumDate' }}</td>
                <td>
                  <button
                    class="btn btn-sm"
                    [ngClass]="user.isActive ? 'btn-outline' : 'btn-primary'"
                    (click)="toggleUser(user)"
                    [disabled]="user.roles.includes('ADMIN') && user.id === 1"
                  >
                    {{ user.isActive ? 'Deactivate' : 'Activate' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Enterprise RBAC Matrix Overview -->
      <div class="card p-4">
        <h3 class="font-bold text-base mb-3">Enterprise Role-Based Access Control (RBAC) Permissions Matrix</h3>
        <div class="table-container">
          <table class="text-xs">
            <thead>
              <tr>
                <th>Department Role</th>
                <th>Sales Order-to-Cash</th>
                <th>BOM & Engineering</th>
                <th>Inventory & Warehousing</th>
                <th>Shop Floor Production</th>
                <th>Supplier Procurement</th>
                <th>Billing & Receivables</th>
                <th>User Admin & Audit</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="font-bold">ADMIN</td>
                <td><span class="text-success">✔ Full Access</span></td>
                <td><span class="text-success">✔ Full Access</span></td>
                <td><span class="text-success">✔ Full Access</span></td>
                <td><span class="text-success">✔ Full Access</span></td>
                <td><span class="text-success">✔ Full Access</span></td>
                <td><span class="text-success">✔ Full Access</span></td>
                <td><span class="text-success font-bold">✔ Superuser</span></td>
              </tr>
              <tr>
                <td class="font-bold">SALES</td>
                <td><span class="text-success">✔ Manage Orders</span></td>
                <td><span class="text-secondary">👁 Read Only</span></td>
                <td><span class="text-secondary">👁 Stock View</span></td>
                <td><span class="text-secondary">👁 WO Status</span></td>
                <td><span class="text-danger">✖ Denied</span></td>
                <td><span class="text-secondary">👁 Read Only</span></td>
                <td><span class="text-danger">✖ Denied</span></td>
              </tr>
              <tr>
                <td class="font-bold">PRODUCTION_MANAGER</td>
                <td><span class="text-secondary">👁 Read Orders</span></td>
                <td><span class="text-success">✔ Configure BOM</span></td>
                <td><span class="text-warning">⚡ Deduct Raw Mat.</span></td>
                <td><span class="text-success">✔ Dispatch & Complete</span></td>
                <td><span class="text-secondary">👁 Read Only</span></td>
                <td><span class="text-danger">✖ Denied</span></td>
                <td><span class="text-danger">✖ Denied</span></td>
              </tr>
              <tr>
                <td class="font-bold">PROCUREMENT_OFFICER</td>
                <td><span class="text-danger">✖ Denied</span></td>
                <td><span class="text-secondary">👁 Read Components</span></td>
                <td><span class="text-success">✔ Stock In & Adjust</span></td>
                <td><span class="text-secondary">👁 Shortage List</span></td>
                <td><span class="text-success">✔ Issue POs & Receive</span></td>
                <td><span class="text-danger">✖ Denied</span></td>
                <td><span class="text-danger">✖ Denied</span></td>
              </tr>
              <tr>
                <td class="font-bold">FINANCE_OFFICER</td>
                <td><span class="text-secondary">👁 Completed Orders</span></td>
                <td><span class="text-danger">✖ Denied</span></td>
                <td><span class="text-secondary">👁 Valuation</span></td>
                <td><span class="text-danger">✖ Denied</span></td>
                <td><span class="text-secondary">👁 PO Invoices</span></td>
                <td><span class="text-success">✔ Generate Invoices & Pay</span></td>
                <td><span class="text-secondary">👁 Reports Only</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add User Modal -->
      <div *ngIf="showModal" class="modal-backdrop">
        <div class="modal card" style="max-width: 500px;">
          <div class="flex-between mb-3">
            <h3 class="font-bold text-lg">Provision New Staff User</h3>
            <button class="btn btn-sm btn-outline" (click)="showModal = false">✕</button>
          </div>
          <form (ngSubmit)="submitUser()">
            <div class="form-group mb-3">
              <label class="form-label font-semibold">Full Employee Name *</label>
              <input type="text" class="form-control" [(ngModel)]="newUser.name" name="name" required placeholder="e.g. Priya Nair" />
            </div>
            <div class="form-group mb-3">
              <label class="form-label font-semibold">Work Email Address *</label>
              <input type="email" class="form-control" [(ngModel)]="newUser.email" name="email" required placeholder="e.g. priya.nair@ordercraft.com" />
            </div>
            <div class="form-group mb-3">
              <label class="form-label font-semibold">Departmental Role *</label>
              <select class="form-control" [(ngModel)]="selectedRole" name="role" required>
                <option value="ADMIN">ADMIN (Full System Administrator)</option>
                <option value="SALES">SALES (Sales & Customer Orders)</option>
                <option value="PRODUCTION_MANAGER">PRODUCTION_MANAGER (Shop Floor & BOM)</option>
                <option value="PROCUREMENT_OFFICER">PROCUREMENT_OFFICER (Vendors & POs)</option>
                <option value="FINANCE_OFFICER">FINANCE_OFFICER (Invoicing & Settlements)</option>
              </select>
            </div>
            <div class="flex-between mt-4">
              <button type="button" class="btn btn-outline" (click)="showModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary">Create User</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal {
      width: 90%;
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }
  `]
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  showModal = false;
  selectedRole: string = 'SALES';

  newUser: { name: string; email: string; isActive: boolean } = {
    name: '',
    email: '',
    isActive: true
  };

  constructor(
    private dataService: OrdercraftDataService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.dataService.users$.subscribe(users => this.users = users);
  }

  getActiveCount(): number {
    return this.users.filter(u => u.isActive).length;
  }

  getRoleCount(role: string): number {
    return this.users.filter(u => u.roles.includes(role)).length;
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'ADMIN': return 'badge-danger';
      case 'SALES': return 'badge-primary';
      case 'PRODUCTION_MANAGER': return 'badge-warning';
      case 'PROCUREMENT_OFFICER': return 'badge-info';
      case 'FINANCE_OFFICER': return 'badge-success';
      default: return 'badge-secondary';
    }
  }

  toggleUser(user: User): void {
    this.dataService.toggleUserStatus(user.id);
  }

  openAddUserModal(): void {
    this.newUser = { name: '', email: '', isActive: true };
    this.selectedRole = 'SALES';
    this.showModal = true;
  }

  submitUser(): void {
    if (!this.newUser.name || !this.newUser.email) {
      this.toast.error('Please enter name and email.');
      return;
    }

    this.dataService.addUser({
      name: this.newUser.name,
      email: this.newUser.email,
      roles: [this.selectedRole],
      isActive: true
    });

    this.showModal = false;
  }
}
