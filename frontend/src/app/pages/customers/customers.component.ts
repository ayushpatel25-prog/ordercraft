import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { OrdercraftDataService } from '../../core/services/ordercraft-data.service';
import { AuthService } from '../../core/services/auth.service';
import { Customer, SalesOrder } from '../../core/models/models';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Customer Master Management</h1>
          <p class="page-subtitle">Manage client accounts, delivery locations, and order histories</p>
        </div>
        <button *ngIf="authService.hasRole(['SALES', 'ADMIN'])" 
                class="btn btn-primary" 
                (click)="openAddModal()">
          + Add New Customer
        </button>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="toolbar oc-card">
        <div class="search-input-wrapper">
          <input type="text" 
                 [(ngModel)]="searchQuery" 
                 placeholder="Search by customer name, email, or city..." 
                 class="form-control" />
        </div>
        <div class="filter-group">
          <select [(ngModel)]="statusFilter" class="form-select" style="width: 140px;">
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      <!-- Customers Table -->
      <div class="table-container oc-card">
        <table class="oc-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Customer Name</th>
              <th>Contact Email</th>
              <th>Phone</th>
              <th>City / State</th>
              <th>Status</th>
              <th>Total Orders</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of filteredCustomers">
              <td class="text-mono" style="font-weight: 600;">#{{ c.id }}</td>
              <td style="font-weight: 700; color: var(--slate-900);">{{ c.name }}</td>
              <td>{{ c.email }}</td>
              <td>{{ c.phone || 'N/A' }}</td>
              <td>{{ c.city }}, {{ c.state }}</td>
              <td>
                <span class="badge" [ngClass]="c.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'">
                  {{ c.status }}
                </span>
              </td>
              <td>
                <span class="badge badge-info">{{ c.totalOrdersCount || 0 }} Orders</span>
              </td>
              <td style="text-align: right;">
                <button class="btn btn-sm btn-secondary" (click)="viewCustomerDetails(c)">
                  View Details
                </button>
                <button *ngIf="authService.hasRole(['SALES', 'ADMIN'])" 
                        class="btn btn-sm btn-outline-primary" 
                        style="margin-left: 6px;"
                        (click)="createOrderForCustomer(c)">
                  New Order
                </button>
              </td>
            </tr>
            <tr *ngIf="filteredCustomers.length === 0">
              <td colspan="8" style="text-align: center; padding: 40px; color: var(--slate-400);">
                No matching customers found
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Add Customer Modal -->
      <div *ngIf="showAddModal" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3 style="font-size: 1.1rem; font-weight: 700;">Add New Customer</h3>
            <button (click)="showAddModal = false" style="background: none; border: none; font-size: 1.25rem; cursor: pointer;">&times;</button>
          </div>
          <form [formGroup]="customerForm" (ngSubmit)="saveCustomer()">
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Company / Customer Name *</label>
                <input type="text" formControlName="name" class="form-control" placeholder="e.g. Acme Manufacturing Ltd" />
              </div>
              <div class="form-group">
                <label class="form-label">Corporate Email Address *</label>
                <input type="email" formControlName="email" class="form-control" placeholder="procurement@acme.com" />
              </div>
              <div class="form-group">
                <label class="form-label">Contact Phone</label>
                <input type="text" formControlName="phone" class="form-control" placeholder="+91 98000 00000" />
              </div>
              <div class="form-group">
                <label class="form-label">Delivery Address</label>
                <input type="text" formControlName="address" class="form-control" placeholder="Plot / Street / Industrial Area" />
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
                <div class="form-group">
                  <label class="form-label">City</label>
                  <input type="text" formControlName="city" class="form-control" placeholder="City" />
                </div>
                <div class="form-group">
                  <label class="form-label">State</label>
                  <input type="text" formControlName="state" class="form-control" placeholder="State" />
                </div>
                <div class="form-group">
                  <label class="form-label">Postal Code</label>
                  <input type="text" formControlName="postalCode" class="form-control" placeholder="PIN" />
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showAddModal = false">Cancel</button>
              <button type="submit" [disabled]="customerForm.invalid" class="btn btn-primary">Save Customer</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Customer Details Modal -->
      <div *ngIf="selectedCustomer" class="modal-overlay">
        <div class="modal-content" style="max-width: 700px;">
          <div class="modal-header">
            <div>
              <h3 style="font-size: 1.15rem; font-weight: 700;">{{ selectedCustomer.name }}</h3>
              <span class="badge" [ngClass]="selectedCustomer.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'">
                {{ selectedCustomer.status }}
              </span>
            </div>
            <button (click)="selectedCustomer = null" style="background: none; border: none; font-size: 1.25rem; cursor: pointer;">&times;</button>
          </div>
          <div class="modal-body">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
              <div>
                <span style="font-size: 0.75rem; color: var(--slate-500);">Email Address:</span>
                <div style="font-weight: 600;">{{ selectedCustomer.email }}</div>
              </div>
              <div>
                <span style="font-size: 0.75rem; color: var(--slate-500);">Phone:</span>
                <div style="font-weight: 600;">{{ selectedCustomer.phone || 'N/A' }}</div>
              </div>
              <div style="grid-column: span 2;">
                <span style="font-size: 0.75rem; color: var(--slate-500);">Full Address:</span>
                <div style="font-weight: 500;">{{ selectedCustomer.address }}, {{ selectedCustomer.city }}, {{ selectedCustomer.state }} - {{ selectedCustomer.postalCode }}</div>
              </div>
            </div>

            <div style="font-weight: 700; font-size: 0.9rem; margin-bottom: 10px; border-top: 1px solid var(--slate-200); padding-top: 16px;">
              Associated Sales Orders History
            </div>
            <div *ngIf="customerOrders.length > 0" class="table-container">
              <table class="oc-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let o of customerOrders">
                    <td class="text-mono" style="font-weight: 600;">{{ o.orderNumber }}</td>
                    <td>{{ o.orderDate | date:'mediumDate' }}</td>
                    <td><span class="badge" [ngClass]="'badge-' + o.status.toLowerCase()">{{ o.status }}</span></td>
                    <td class="text-mono">{{ authService.currencySymbol }}{{ o.totalAmount | number:'1.0-0' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div *ngIf="customerOrders.length === 0" style="padding: 16px; text-align: center; color: var(--slate-400);">
              No past sales orders recorded for this customer.
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="selectedCustomer = null">Close</button>
            <button *ngIf="authService.hasRole(['SALES', 'ADMIN'])" 
                    class="btn btn-primary" 
                    (click)="createOrderForCustomer(selectedCustomer)">
              + Create Sales Order
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--slate-900);
      letter-spacing: -0.02em;
    }

    .page-subtitle {
      font-size: 0.8125rem;
      color: var(--slate-500);
      margin-top: 4px;
    }

    .toolbar {
      padding: 14px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }

    .search-input-wrapper {
      flex: 1;
      min-width: 280px;
    }
  `]
})
export class CustomersComponent implements OnInit {
  customers: Customer[] = [];
  searchQuery = '';
  statusFilter = 'ALL';

  showAddModal = false;
  selectedCustomer: Customer | null = null;
  customerOrders: SalesOrder[] = [];
  customerForm!: FormGroup;

  constructor(
    private dataService: OrdercraftDataService,
    public authService: AuthService,
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.dataService.customers$.subscribe(list => {
      this.customers = list;
    });

    this.customerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      address: [''],
      city: [''],
      state: [''],
      postalCode: ['']
    });
  }

  get filteredCustomers(): Customer[] {
    return this.customers.filter(c => {
      const matchesSearch = !this.searchQuery || 
        c.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        c.city.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchesStatus = this.statusFilter === 'ALL' || c.status === this.statusFilter;
      return matchesSearch && matchesStatus;
    });
  }

  openAddModal(): void {
    this.customerForm.reset();
    this.showAddModal = true;
  }

  saveCustomer(): void {
    if (this.customerForm.invalid) return;

    this.dataService.addCustomer({
      ...this.customerForm.value,
      status: 'ACTIVE'
    });

    this.showAddModal = false;
  }

  viewCustomerDetails(customer: Customer): void {
    this.selectedCustomer = customer;
    this.dataService.salesOrders$.subscribe(orders => {
      this.customerOrders = orders.filter(o => o.customerId === customer.id);
    });
  }

  createOrderForCustomer(customer: Customer): void {
    this.selectedCustomer = null;
    this.router.navigate(['/orders'], { queryParams: { customerId: customer.id } });
  }
}
