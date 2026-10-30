import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { OrdercraftDataService } from '../../core/services/ordercraft-data.service';
import { AuthService } from '../../core/services/auth.service';
import { Product } from '../../core/models/models';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Product & Materials Catalog</h1>
          <p class="page-subtitle">Item master containing finished manufactured goods, sub-assemblies, and raw materials</p>
        </div>
        <button *ngIf="authService.hasRole(['PRODUCTION_MANAGER', 'ADMIN'])" 
                class="btn btn-primary" 
                (click)="openAddModal()">
          + Add New Product
        </button>
      </div>

      <!-- Filter Tabs & Search -->
      <div class="toolbar oc-card">
        <div class="tab-pills">
          <button class="tab-pill" [class.active]="categoryFilter === 'ALL'" (click)="categoryFilter = 'ALL'">All Items ({{ products.length }})</button>
          <button class="tab-pill" [class.active]="categoryFilter === 'FINISHED_GOOD'" (click)="categoryFilter = 'FINISHED_GOOD'">Finished Goods</button>
          <button class="tab-pill" [class.active]="categoryFilter === 'RAW_MATERIAL'" (click)="categoryFilter = 'RAW_MATERIAL'">Raw Materials</button>
          <button class="tab-pill" [class.active]="categoryFilter === 'SUB_ASSEMBLY'" (click)="categoryFilter = 'SUB_ASSEMBLY'">Sub-Assemblies</button>
        </div>
        <div class="search-box-wrap">
          <input type="text" [(ngModel)]="searchQuery" placeholder="Search SKU or name..." class="form-control" />
        </div>
      </div>

      <!-- Products Grid / Table -->
      <div class="table-container oc-card">
        <table class="oc-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product / Material Name</th>
              <th>Category</th>
              <th>Unit Price</th>
              <th>Unit</th>
              <th>Total Stock</th>
              <th>Available Stock</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of filteredProducts">
              <td class="text-mono" style="font-weight: 700; color: var(--primary);">{{ p.sku }}</td>
              <td>
                <div style="font-weight: 600; color: var(--slate-900);">{{ p.name }}</div>
                <div style="font-size: 0.75rem; color: var(--slate-500);">{{ p.description }}</div>
              </td>
              <td>
                <span class="badge" [ngClass]="getCategoryBadgeClass(p.category)">
                  {{ p.category.replace('_', ' ') }}
                </span>
              </td>
              <td class="text-mono">{{ authService.currencySymbol }}{{ p.unitPrice | number:'1.2-2' }}</td>
              <td>{{ p.unit }}</td>
              <td style="font-weight: 600;">{{ p.currentStock || 0 }} {{ p.unit }}</td>
              <td>
                <span [style.color]="(p.availableStock || 0) <= 5 ? 'var(--danger)' : 'var(--success)'" style="font-weight: 700;">
                  {{ p.availableStock || 0 }} {{ p.unit }}
                </span>
              </td>
              <td>
                <span class="badge badge-success">{{ p.status }}</span>
              </td>
            </tr>
            <tr *ngIf="filteredProducts.length === 0">
              <td colspan="8" style="text-align: center; padding: 40px; color: var(--slate-400);">
                No matching products found
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Add Product Modal -->
      <div *ngIf="showAddModal" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3 style="font-size: 1.1rem; font-weight: 700;">Add Product / Material to Master</h3>
            <button (click)="showAddModal = false" style="background: none; border: none; font-size: 1.25rem; cursor: pointer;">&times;</button>
          </div>
          <form [formGroup]="productForm" (ngSubmit)="saveProduct()">
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Product / Material Name *</label>
                <input type="text" formControlName="name" class="form-control" placeholder="e.g. Industrial Valve V-200" />
              </div>
              <div class="form-group">
                <label class="form-label">SKU Code *</label>
                <input type="text" formControlName="sku" class="form-control" placeholder="e.g. FG-VLV-200 or RM-BRG-101" />
              </div>
              <div class="form-group">
                <label class="form-label">Description</label>
                <textarea formControlName="description" class="form-control" rows="2" placeholder="Specifications and notes"></textarea>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
                <div class="form-group">
                  <label class="form-label">Category *</label>
                  <select formControlName="category" class="form-select">
                    <option value="FINISHED_GOOD">Finished Good</option>
                    <option value="RAW_MATERIAL">Raw Material</option>
                    <option value="SUB_ASSEMBLY">Sub Assembly</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Unit of Measure *</label>
                  <select formControlName="unit" class="form-select">
                    <option value="UNIT">UNIT</option>
                    <option value="PCS">PCS</option>
                    <option value="KG">KG</option>
                    <option value="SHT">SHT</option>
                    <option value="MTR">MTR</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Unit Price ({{ authService.currencySymbol }}) *</label>
                  <input type="number" formControlName="unitPrice" class="form-control" min="0" step="0.01" />
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showAddModal = false">Cancel</button>
              <button type="submit" [disabled]="productForm.invalid" class="btn btn-primary">Save Product</button>
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
      padding: 12px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
    }

    .tab-pills {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .tab-pill {
      background: transparent;
      border: 1px solid var(--slate-200);
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--slate-600);
      cursor: pointer;
      transition: all 0.15s;
    }

    .tab-pill:hover {
      background: var(--slate-100);
    }

    .tab-pill.active {
      background: var(--primary);
      color: #ffffff;
      border-color: var(--primary);
    }

    .search-box-wrap {
      width: 260px;
    }
  `]
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  categoryFilter = 'ALL';
  searchQuery = '';
  showAddModal = false;
  productForm!: FormGroup;

  constructor(
    private dataService: OrdercraftDataService,
    public authService: AuthService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.dataService.products$.subscribe(list => {
      this.products = list;
    });

    this.productForm = this.fb.group({
      name: ['', Validators.required],
      sku: ['', Validators.required],
      description: [''],
      category: ['FINISHED_GOOD', Validators.required],
      unit: ['PCS', Validators.required],
      unitPrice: [1000, [Validators.required, Validators.min(0)]]
    });
  }

  get filteredProducts(): Product[] {
    return this.products.filter(p => {
      const matchCat = this.categoryFilter === 'ALL' || p.category === this.categoryFilter;
      const matchSearch = !this.searchQuery || 
        p.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }

  getCategoryBadgeClass(category: string): string {
    switch (category) {
      case 'FINISHED_GOOD': return 'badge-info';
      case 'RAW_MATERIAL': return 'badge-warning';
      case 'SUB_ASSEMBLY': return 'badge-success';
      default: return 'badge-neutral';
    }
  }

  openAddModal(): void {
    this.productForm.reset({
      category: 'FINISHED_GOOD',
      unit: 'PCS',
      unitPrice: 1000
    });
    this.showAddModal = true;
  }

  saveProduct(): void {
    if (this.productForm.invalid) return;

    this.dataService.addProduct({
      ...this.productForm.value,
      status: 'ACTIVE'
    });

    this.showAddModal = false;
  }
}
