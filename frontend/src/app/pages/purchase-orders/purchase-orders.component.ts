import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrdercraftDataService } from '../../core/services/ordercraft-data.service';
import { AuthService } from '../../core/services/auth.service';
import { Product, PurchaseOrder, Supplier } from '../../core/models/models';

@Component({
  selector: 'app-purchase-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Procurement & Purchase Orders (PTP)</h1>
          <p class="page-subtitle">Replenish raw material shortages, manage vendor purchase orders, and receive warehouse goods</p>
        </div>
        <button *ngIf="authService.hasRole(['PROCUREMENT_OFFICER', 'ADMIN'])" 
                class="btn btn-primary" 
                (click)="openCreateModal()">
          + Create Purchase Order
        </button>
      </div>

      <!-- Toolbar -->
      <div class="toolbar oc-card">
        <div style="flex: 1; min-width: 260px;">
          <input type="text" [(ngModel)]="searchQuery" placeholder="Search PO # or Supplier..." class="form-control" />
        </div>
        <select [(ngModel)]="statusFilter" class="form-select" style="width: 170px;">
          <option value="ALL">All Statuses</option>
          <option value="DRAFT">DRAFT</option>
          <option value="SUBMITTED">SUBMITTED</option>
          <option value="APPROVED">APPROVED</option>
          <option value="ORDERED">ORDERED</option>
          <option value="PARTIALLY_RECEIVED">PARTIALLY RECEIVED</option>
          <option value="RECEIVED">RECEIVED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </div>

      <!-- Purchase Orders Table -->
      <div class="table-container oc-card">
        <table class="oc-table">
          <thead>
            <tr>
              <th>PO #</th>
              <th>Supplier</th>
              <th>Order Date</th>
              <th>Expected Date</th>
              <th>Items</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let po of filteredPurchaseOrders">
              <td class="text-mono" style="font-weight: 700; color: var(--primary);">{{ po.purchaseOrderNumber }}</td>
              <td style="font-weight: 600;">{{ po.supplierName }}</td>
              <td>{{ po.orderDate | date:'mediumDate' }}</td>
              <td>{{ po.expectedDeliveryDate | date:'mediumDate' }}</td>
              <td>{{ po.items.length }} line(s)</td>
              <td class="text-mono" style="font-weight: 700;">{{ authService.currencySymbol }}{{ po.totalAmount | number:'1.0-0' }}</td>
              <td>
                <span class="badge" [ngClass]="'badge-' + po.status.toLowerCase()">
                  {{ po.status.replace('_', ' ') }}
                </span>
              </td>
              <td style="text-align: right;">
                <button class="btn btn-sm btn-secondary" (click)="viewPoDetails(po)">Inspect</button>
                <button *ngIf="po.status === 'DRAFT' && authService.hasRole(['PROCUREMENT_OFFICER', 'ADMIN'])" 
                        class="btn btn-sm btn-outline-primary" style="margin-left: 6px;"
                        (click)="submitPo(po.id)">
                  Submit
                </button>
                <button *ngIf="(po.status === 'SUBMITTED' || po.status === 'DRAFT') && authService.hasRole(['ADMIN', 'PROCUREMENT_OFFICER'])" 
                        class="btn btn-sm btn-success" style="margin-left: 6px;"
                        (click)="approvePo(po.id)">
                  Approve
                </button>
                <button *ngIf="(po.status === 'ORDERED' || po.status === 'PARTIALLY_RECEIVED') && authService.hasRole(['PROCUREMENT_OFFICER', 'ADMIN'])" 
                        class="btn btn-sm btn-primary" style="margin-left: 6px;"
                        (click)="openReceiveModal(po)">
                  Receive Goods
                </button>
              </td>
            </tr>
            <tr *ngIf="filteredPurchaseOrders.length === 0">
              <td colspan="8" style="text-align: center; padding: 40px; color: var(--slate-400);">No purchase orders found</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Create PO Modal -->
      <div *ngIf="showCreateModal" class="modal-overlay">
        <div class="modal-content" style="max-width: 750px;">
          <div class="modal-header">
            <h3 style="font-size: 1.15rem; font-weight: 700;">Create Purchase Order (Procure-to-Pay)</h3>
            <button (click)="showCreateModal = false" style="background: none; border: none; font-size: 1.25rem; cursor: pointer;">&times;</button>
          </div>
          <div class="modal-body">
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div class="form-group">
                <label class="form-label">Vendor Supplier *</label>
                <select [(ngModel)]="newPoSupplierId" class="form-select">
                  <option [ngValue]="null">-- Select Vendor --</option>
                  <option *ngFor="let s of suppliers" [ngValue]="s.id">{{ s.name }}</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Expected Delivery Date</label>
                <input type="date" [(ngModel)]="newPoDeliveryDate" class="form-control" />
              </div>
            </div>

            <div style="font-weight: 700; font-size: 0.875rem; margin-bottom: 8px;">Order Line Items (Raw Materials)</div>
            <div class="table-container" style="margin-bottom: 16px;">
              <table class="oc-table">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Unit Cost ({{ authService.currencySymbol }})</th>
                    <th>Qty</th>
                    <th>Subtotal ({{ authService.currencySymbol }})</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let line of poDraftItems; let i = index">
                    <td>
                      <select [(ngModel)]="line.materialId" (ngModelChange)="onMaterialChange(line)" class="form-select">
                        <option *ngFor="let m of rawMaterials" [ngValue]="m.id">{{ m.name }} ({{ m.sku }})</option>
                      </select>
                    </td>
                    <td class="text-mono">{{ authService.currencySymbol }}{{ line.unitPrice }}</td>
                    <td style="width: 100px;">
                      <input type="number" [(ngModel)]="line.quantity" min="1" class="form-control" style="padding: 4px 8px;" />
                    </td>
                    <td class="text-mono" style="font-weight: 700;">{{ authService.currencySymbol }}{{ (line.quantity * line.unitPrice) | number:'1.2-2' }}</td>
                    <td style="text-align: right;">
                      <button *ngIf="poDraftItems.length > 1" class="btn btn-sm btn-danger" (click)="poDraftItems.splice(i, 1)">&times;</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <button type="button" class="btn btn-sm btn-secondary" (click)="addPoLine()">+ Add Material Line</button>

            <div style="text-align: right; margin-top: 16px;">
              <span style="font-size: 0.8125rem; color: var(--slate-600);">Total PO Commitment: </span>
              <strong class="text-mono" style="font-size: 1.15rem; color: var(--slate-900);">{{ authService.currencySymbol }}{{ calculatePoTotal() | number:'1.2-2' }}</strong>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showCreateModal = false">Cancel</button>
            <button class="btn btn-primary" [disabled]="!canSubmitPo()" (click)="savePurchaseOrder()">Save PO (Draft)</button>
          </div>
        </div>
      </div>

      <!-- Receive Materials Modal (Section 13) -->
      <div *ngIf="selectedPoForReceive" class="modal-overlay">
        <div class="modal-content" style="max-width: 720px;">
          <div class="modal-header">
            <h3 style="font-size: 1.15rem; font-weight: 700;">Receive Material Consignment: {{ selectedPoForReceive.purchaseOrderNumber }}</h3>
            <button (click)="selectedPoForReceive = null" style="background: none; border: none; font-size: 1.25rem; cursor: pointer;">&times;</button>
          </div>
          <div class="modal-body">
            <p style="font-size: 0.8125rem; color: var(--slate-600); margin-bottom: 16px;">
              Enter received item quantities. Confirmed receipts will automatically increment physical warehouse stock.
            </p>
            <div class="table-container">
              <table class="oc-table">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Ordered Qty</th>
                    <th>Already Received</th>
                    <th>Remaining Expected</th>
                    <th>Receive Now</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of receiveFormItems">
                    <td style="font-weight: 600;">{{ item.materialName }}</td>
                    <td>{{ item.quantity }} {{ item.unit }}</td>
                    <td>{{ item.receivedQuantity }} {{ item.unit }}</td>
                    <td style="font-weight: 700; color: var(--primary);">{{ item.quantity - item.receivedQuantity }} {{ item.unit }}</td>
                    <td style="width: 120px;">
                      <input type="number" 
                             [(ngModel)]="item.receiveNow" 
                             [max]="item.quantity - item.receivedQuantity" 
                             min="0" 
                             class="form-control" 
                             style="padding: 4px 8px; font-weight: 700;" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="selectedPoForReceive = null">Cancel</button>
            <button class="btn btn-success" (click)="confirmReceipt()">
              ✓ Confirm Receipt & Update Warehouse Stock
            </button>
          </div>
        </div>
      </div>

      <!-- PO Inspection Details Modal -->
      <div *ngIf="inspectPo" class="modal-overlay">
        <div class="modal-content" style="max-width: 700px;">
          <div class="modal-header">
            <div>
              <h3 style="font-size: 1.15rem; font-weight: 800;">{{ inspectPo.purchaseOrderNumber }}</h3>
              <div style="font-size: 0.8125rem; color: var(--slate-500);">Supplier: {{ inspectPo.supplierName }}</div>
            </div>
            <button (click)="inspectPo = null" style="background: none; border: none; font-size: 1.25rem; cursor: pointer;">&times;</button>
          </div>
          <div class="modal-body">
            <div class="table-container">
              <table class="oc-table">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>SKU</th>
                    <th>Ordered</th>
                    <th>Received</th>
                    <th>Unit Cost</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let line of inspectPo.items">
                    <td style="font-weight: 600;">{{ line.materialName }}</td>
                    <td class="text-mono">{{ line.materialSku }}</td>
                    <td>{{ line.quantity }} {{ line.unit }}</td>
                    <td style="font-weight: 700; color: var(--success);">{{ line.receivedQuantity }} {{ line.unit }}</td>
                    <td class="text-mono">{{ authService.currencySymbol }}{{ line.unitPrice | number:'1.2-2' }}</td>
                    <td class="text-mono" style="font-weight: 700;">{{ authService.currencySymbol }}{{ line.totalPrice | number:'1.2-2' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="inspectPo = null">Close</button>
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
export class PurchaseOrdersComponent implements OnInit {
  purchaseOrders: PurchaseOrder[] = [];
  suppliers: Supplier[] = [];
  rawMaterials: Product[] = [];

  searchQuery = '';
  statusFilter = 'ALL';

  showCreateModal = false;
  selectedPoForReceive: PurchaseOrder | null = null;
  inspectPo: PurchaseOrder | null = null;

  newPoSupplierId: number | null = null;
  newPoDeliveryDate = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
  poDraftItems: { materialId: number; quantity: number; unitPrice: number }[] = [];
  receiveFormItems: any[] = [];

  constructor(
    private dataService: OrdercraftDataService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.dataService.purchaseOrders$.subscribe(list => this.purchaseOrders = list);
    this.dataService.suppliers$.subscribe(list => this.suppliers = list.filter(s => s.status === 'ACTIVE'));
    this.dataService.products$.subscribe(list => {
      this.rawMaterials = list.filter(p => p.category === 'RAW_MATERIAL' || p.category === 'SUB_ASSEMBLY');
    });
  }

  get filteredPurchaseOrders(): PurchaseOrder[] {
    return this.purchaseOrders.filter(po => {
      const matchSearch = !this.searchQuery ||
        po.purchaseOrderNumber.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        po.supplierName.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchStatus = this.statusFilter === 'ALL' || po.status === this.statusFilter;
      return matchSearch && matchStatus;
    });
  }

  openCreateModal(): void {
    this.newPoSupplierId = this.suppliers[0]?.id || null;
    this.newPoDeliveryDate = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    const defaultMat = this.rawMaterials[0];
    this.poDraftItems = [
      { materialId: defaultMat ? defaultMat.id : 5, quantity: 50, unitPrice: defaultMat ? defaultMat.unitPrice : 450 }
    ];
    this.showCreateModal = true;
  }

  onMaterialChange(line: any): void {
    const mat = this.rawMaterials.find(m => m.id === line.materialId);
    if (mat) line.unitPrice = mat.unitPrice;
  }

  addPoLine(): void {
    const defaultMat = this.rawMaterials[0];
    this.poDraftItems.push({
      materialId: defaultMat ? defaultMat.id : 5,
      quantity: 20,
      unitPrice: defaultMat ? defaultMat.unitPrice : 0
    });
  }

  calculatePoTotal(): number {
    return this.poDraftItems.reduce((acc, it) => acc + (it.quantity * it.unitPrice), 0);
  }

  canSubmitPo(): boolean {
    return !!this.newPoSupplierId && this.poDraftItems.length > 0 && this.poDraftItems.every(i => i.quantity > 0);
  }

  savePurchaseOrder(): void {
    if (!this.canSubmitPo()) return;
    this.dataService.createPurchaseOrder({
      supplierId: this.newPoSupplierId!,
      expectedDeliveryDate: this.newPoDeliveryDate,
      items: this.poDraftItems
    });
    this.showCreateModal = false;
  }

  submitPo(id: number): void {
    this.dataService.submitPurchaseOrder(id);
  }

  approvePo(id: number): void {
    this.dataService.approvePurchaseOrder(id);
  }

  openReceiveModal(po: PurchaseOrder): void {
    this.selectedPoForReceive = po;
    this.receiveFormItems = po.items.map(i => ({
      itemId: i.id,
      materialName: i.materialName,
      unit: i.unit,
      quantity: i.quantity,
      receivedQuantity: i.receivedQuantity,
      receiveNow: Math.max(0, i.quantity - i.receivedQuantity)
    }));
  }

  confirmReceipt(): void {
    if (!this.selectedPoForReceive) return;
    const payload = this.receiveFormItems.map(item => ({
      itemId: item.itemId,
      quantity: item.receiveNow
    }));
    this.dataService.receivePurchaseOrderMaterials(this.selectedPoForReceive.id, payload);
    this.selectedPoForReceive = null;
  }

  viewPoDetails(po: PurchaseOrder): void {
    this.inspectPo = po;
  }
}
