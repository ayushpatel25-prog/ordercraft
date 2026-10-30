import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { OrdercraftDataService } from '../../core/services/ordercraft-data.service';
import { AuthService } from '../../core/services/auth.service';
import { Supplier } from '../../core/models/models';

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Supplier & Vendor Directory</h1>
          <p class="page-subtitle">Procurement suppliers, raw material partners, and purchase orders</p>
        </div>
        <button *ngIf="authService.hasRole(['PROCUREMENT_OFFICER', 'ADMIN'])" 
                class="btn btn-primary" 
                (click)="showAddModal = true">
          + Add New Supplier
        </button>
      </div>

      <!-- Search Toolbar -->
      <div class="toolbar oc-card">
        <input type="text" [(ngModel)]="searchQuery" placeholder="Search suppliers by name, contact, or email..." class="form-control" />
      </div>

      <!-- Suppliers Table -->
      <div class="table-container oc-card">
        <table class="oc-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Supplier Name</th>
              <th>Contact Person</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Status</th>
              <th>POs Issued</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of filteredSuppliers">
              <td class="text-mono" style="font-weight: 600;">#{{ s.id }}</td>
              <td style="font-weight: 700; color: var(--slate-900);">{{ s.name }}</td>
              <td>{{ s.contactPerson }}</td>
              <td>{{ s.email }}</td>
              <td>{{ s.phone }}</td>
              <td>{{ s.address }}</td>
              <td>
                <span class="badge" [ngClass]="s.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'">{{ s.status }}</span>
              </td>
              <td><span class="badge badge-info">{{ s.totalPurchaseOrders || 0 }} POs</span></td>
            </tr>
            <tr *ngIf="filteredSuppliers.length === 0">
              <td colspan="8" style="text-align: center; padding: 40px; color: var(--slate-400);">No suppliers found</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Add Supplier Modal -->
      <div *ngIf="showAddModal" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3 style="font-size: 1.15rem; font-weight: 700;">Add New Supplier</h3>
            <button (click)="showAddModal = false" style="background: none; border: none; font-size: 1.25rem; cursor: pointer;">&times;</button>
          </div>
          <form [formGroup]="supplierForm" (ngSubmit)="saveSupplier()">
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Vendor Company Name *</label>
                <input type="text" formControlName="name" class="form-control" placeholder="e.g. Apex Industrial Metals Ltd" />
              </div>
              <div class="form-group">
                <label class="form-label">Contact Person</label>
                <input type="text" formControlName="contactPerson" class="form-control" placeholder="e.g. Rajesh Shah" />
              </div>
              <div class="form-group">
                <label class="form-label">Email Address</label>
                <input type="email" formControlName="email" class="form-control" placeholder="orders@vendor.com" />
              </div>
              <div class="form-group">
                <label class="form-label">Phone</label>
                <input type="text" formControlName="phone" class="form-control" placeholder="+91 98000 00000" />
              </div>
              <div class="form-group">
                <label class="form-label">Address</label>
                <input type="text" formControlName="address" class="form-control" placeholder="Industrial estate / city" />
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showAddModal = false">Cancel</button>
              <button type="submit" [disabled]="supplierForm.invalid" class="btn btn-primary">Save Supplier</button>
            </div>
          </form>
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
      padding: 12px 20px;
    }
  `]
})
export class SuppliersComponent implements OnInit {
  suppliers: Supplier[] = [];
  searchQuery = '';
  showAddModal = false;
  supplierForm!: FormGroup;

  constructor(
    private dataService: OrdercraftDataService,
    public authService: AuthService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.dataService.suppliers$.subscribe(list => this.suppliers = list);
    this.supplierForm = this.fb.group({
      name: ['', Validators.required],
      contactPerson: [''],
      email: ['', Validators.email],
      phone: [''],
      address: ['']
    });
  }

  get filteredSuppliers(): Supplier[] {
    return this.suppliers.filter(s => {
      return !this.searchQuery ||
        s.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        s.contactPerson.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(this.searchQuery.toLowerCase());
    });
  }

  saveSupplier(): void {
    if (this.supplierForm.invalid) return;
    // Add logic
    this.dataService.addNotification('Supplier Added', `Supplier ${this.supplierForm.value.name} registered`, 'INFO', 'PROCUREMENT_OFFICER');
    this.showAddModal = false;
  }
}
