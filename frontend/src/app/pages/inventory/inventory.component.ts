import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrdercraftDataService } from '../../core/services/ordercraft-data.service';
import { AuthService } from '../../core/services/auth.service';
import { Inventory, InventoryTransaction } from '../../core/models/models';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Inventory Management & Stock Control</h1>
          <p class="page-subtitle">Warehouse inventory tracking, safety reorder limits, and stock movement traceability</p>
        </div>
        <button *ngIf="authService.hasRole(['PRODUCTION_MANAGER', 'PROCUREMENT_OFFICER', 'ADMIN'])" 
                class="btn btn-primary" 
                (click)="openAdjustModal()">
          Stock Adjustment
        </button>
      </div>

      <!-- Inventory Metrics Bar -->
      <div class="toolbar oc-card">
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-sm" [ngClass]="currentTab === 'STOCK' ? 'btn-primary' : 'btn-secondary'" (click)="currentTab = 'STOCK'">
            Warehouse Stock Levels
          </button>
          <button class="btn btn-sm" [ngClass]="currentTab === 'TX' ? 'btn-primary' : 'btn-secondary'" (click)="currentTab = 'TX'">
            Transaction Log & Movements
          </button>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
          <label style="display: flex; align-items: center; gap: 6px; font-size: 0.8125rem; font-weight: 600; cursor: pointer;">
            <input type="checkbox" [(ngModel)]="onlyLowStock" />
            Show Low Stock Warnings Only
          </label>
          <input type="text" [(ngModel)]="searchQuery" placeholder="Filter by product or SKU..." class="form-control" style="width: 220px;" />
        </div>
      </div>

      <!-- Stock Table View -->
      <div *ngIf="currentTab === 'STOCK'" class="table-container oc-card">
        <table class="oc-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product / Material</th>
              <th>Location</th>
              <th>Physical Stock</th>
              <th>Reserved</th>
              <th>Available Stock</th>
              <th>Reorder Limit</th>
              <th>Status</th>
              <th style="text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of filteredInventory">
              <td class="text-mono" style="font-weight: 700; color: var(--primary);">{{ item.productSku }}</td>
              <td style="font-weight: 600; color: var(--slate-900);">{{ item.productName }}</td>
              <td><span class="badge badge-neutral">{{ item.location }}</span></td>
              <td style="font-weight: 600;">{{ item.quantity }} {{ item.unit }}</td>
              <td>{{ item.reservedQuantity }} {{ item.unit }}</td>
              <td class="text-mono" [style.color]="item.availableQuantity <= item.reorderLevel ? 'var(--danger)' : 'var(--success)'" style="font-weight: 800; font-size: 0.95rem;">
                {{ item.availableQuantity }} {{ item.unit }}
              </td>
              <td>{{ item.reorderLevel }} {{ item.unit }}</td>
              <td>
                <span class="badge" [ngClass]="getBadgeClass(item.status)">
                  {{ item.status.replace('_', ' ') }}
                </span>
              </td>
              <td style="text-align: right;">
                <button *ngIf="authService.hasRole(['PRODUCTION_MANAGER', 'PROCUREMENT_OFFICER', 'ADMIN'])" 
                        class="btn btn-sm btn-secondary" 
                        (click)="openAdjustModal(item)">
                  Adjust
                </button>
              </td>
            </tr>
            <tr *ngIf="filteredInventory.length === 0">
              <td colspan="9" style="text-align: center; padding: 40px; color: var(--slate-400);">
                No inventory records matching filters
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Transactions View -->
      <div *ngIf="currentTab === 'TX'" class="table-container oc-card">
        <table class="oc-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Product / Material</th>
              <th>Movement Type</th>
              <th>Quantity</th>
              <th>Previous Qty</th>
              <th>New Qty</th>
              <th>Performer</th>
              <th>Notes / Ref</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let tx of transactions">
              <td>{{ tx.createdAt | date:'short' }}</td>
              <td style="font-weight: 600;">{{ tx.productName }} ({{ tx.productSku }})</td>
              <td>
                <span class="badge" [ngClass]="getTxBadgeClass(tx.transactionType)">
                  {{ tx.transactionType }}
                </span>
              </td>
              <td class="text-mono" style="font-weight: 700;">{{ tx.quantity }}</td>
              <td>{{ tx.previousQuantity }}</td>
              <td style="font-weight: 600;">{{ tx.newQuantity }}</td>
              <td>{{ tx.performedBy || 'System' }}</td>
              <td style="font-size: 0.75rem; color: var(--slate-500);">{{ tx.notes }} ({{ tx.referenceType }}: {{ tx.referenceId }})</td>
            </tr>
            <tr *ngIf="transactions.length === 0">
              <td colspan="8" style="text-align: center; padding: 40px; color: var(--slate-400);">
                No inventory transactions logged yet
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Stock Adjustment Modal -->
      <div *ngIf="showAdjustModal" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3 style="font-size: 1.15rem; font-weight: 700;">Adjust Inventory Stock</h3>
            <button (click)="showAdjustModal = false" style="background: none; border: none; font-size: 1.25rem; cursor: pointer;">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Product / Material *</label>
              <select [(ngModel)]="adjustProductId" class="form-select">
                <option *ngFor="let inv of inventory" [ngValue]="inv.productId">
                  {{ inv.productName }} ({{ inv.productSku }}) - Current: {{ inv.quantity }} {{ inv.unit }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Adjustment Quantity Diff (+ to add, - to deduct) *</label>
              <input type="number" [(ngModel)]="adjustQuantity" class="form-control" placeholder="e.g. +10 or -5" />
            </div>
            <div class="form-group">
              <label class="form-label">Reason / Notes</label>
              <textarea [(ngModel)]="adjustNotes" class="form-control" rows="2" placeholder="Cycle count variance, scrap disposal, or audit check"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showAdjustModal = false">Cancel</button>
            <button class="btn btn-primary" [disabled]="!adjustProductId || adjustQuantity === 0" (click)="saveAdjustment()">
              Confirm Stock Adjustment
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
      padding: 12px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
    }
  `]
})
export class InventoryComponent implements OnInit {
  inventory: Inventory[] = [];
  transactions: InventoryTransaction[] = [];
  currentTab: 'STOCK' | 'TX' = 'STOCK';
  onlyLowStock = false;
  searchQuery = '';

  showAdjustModal = false;
  adjustProductId: number | null = null;
  adjustQuantity = 0;
  adjustNotes = '';

  constructor(
    private dataService: OrdercraftDataService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.dataService.inventory$.subscribe(list => this.inventory = list);
    this.dataService.transactions$.subscribe(list => this.transactions = list);
  }

  get filteredInventory(): Inventory[] {
    return this.inventory.filter(item => {
      const matchLow = !this.onlyLowStock || item.status === 'LOW_STOCK' || item.status === 'OUT_OF_STOCK';
      const matchSearch = !this.searchQuery ||
        item.productName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        item.productSku.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchLow && matchSearch;
    });
  }

  getBadgeClass(status: string): string {
    switch (status) {
      case 'IN_STOCK': return 'badge-success';
      case 'LOW_STOCK': return 'badge-warning';
      case 'OUT_OF_STOCK': return 'badge-danger';
      default: return 'badge-neutral';
    }
  }

  getTxBadgeClass(type: string): string {
    switch (type) {
      case 'RECEIVED': return 'badge-success';
      case 'CONSUMED': return 'badge-warning';
      case 'RESERVED': return 'badge-info';
      case 'RELEASED': return 'badge-neutral';
      default: return 'badge-info';
    }
  }

  openAdjustModal(item?: Inventory): void {
    this.adjustProductId = item ? item.productId : (this.inventory[0]?.productId || null);
    this.adjustQuantity = 0;
    this.adjustNotes = 'Routine inventory cycle reconciliation';
    this.showAdjustModal = true;
  }

  saveAdjustment(): void {
    if (!this.adjustProductId || this.adjustQuantity === 0) return;
    this.dataService.adjustInventory(this.adjustProductId, this.adjustQuantity, this.adjustNotes);
    this.showAdjustModal = false;
  }
}
