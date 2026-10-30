import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { OrdercraftDataService } from '../../core/services/ordercraft-data.service';
import { AuthService } from '../../core/services/auth.service';
import { Customer, Product, SalesOrder, BomExplosionItem } from '../../core/models/models';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Sales Orders & Order-to-Cash</h1>
          <p class="page-subtitle">Track customer orders, auto-trigger BOM validation, and transition to shop-floor work orders</p>
        </div>
        <button *ngIf="authService.hasRole(['SALES', 'ADMIN'])" 
                class="btn btn-primary" 
                (click)="openCreateModal()">
          + Create Sales Order
        </button>
      </div>

      <!-- Filter toolbar -->
      <div class="toolbar oc-card">
        <div style="flex: 1; min-width: 260px;">
          <input type="text" [(ngModel)]="searchQuery" placeholder="Search by Order # or Customer..." class="form-control" />
        </div>
        <div style="display: flex; gap: 8px;">
          <select [(ngModel)]="statusFilter" class="form-select" style="width: 170px;">
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      <!-- Orders Table -->
      <div class="table-container oc-card">
        <table class="oc-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Order Date</th>
              <th>Delivery Due</th>
              <th>Items</th>
              <th>Total Amount</th>
              <th>Work Order</th>
              <th>Invoice</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let o of filteredOrders">
              <td class="text-mono" style="font-weight: 700; color: var(--primary);">{{ o.orderNumber }}</td>
              <td style="font-weight: 600;">{{ o.customerName }}</td>
              <td>{{ o.orderDate | date:'mediumDate' }}</td>
              <td>{{ o.expectedDeliveryDate | date:'mediumDate' }}</td>
              <td>{{ o.items.length }} line(s)</td>
              <td class="text-mono" style="font-weight: 700;">{{ authService.currencySymbol }}{{ o.totalAmount | number:'1.0-0' }}</td>
              <td>
                <span *ngIf="o.associatedWorkOrderNumber" class="text-mono" style="font-size: 0.75rem; font-weight: 600; color: var(--slate-700);">
                  {{ o.associatedWorkOrderNumber }}
                </span>
                <span *ngIf="!o.associatedWorkOrderNumber" style="color: var(--slate-400); font-size: 0.75rem;">—</span>
              </td>
              <td>
                <span *ngIf="o.associatedInvoiceNumber" class="text-mono" style="font-size: 0.75rem; font-weight: 600; color: var(--success);">
                  {{ o.associatedInvoiceNumber }}
                </span>
                <span *ngIf="!o.associatedInvoiceNumber" style="color: var(--slate-400); font-size: 0.75rem;">—</span>
              </td>
              <td>
                <span class="badge" [ngClass]="'badge-' + o.status.toLowerCase()">
                  {{ o.status.replace('_', ' ') }}
                </span>
              </td>
              <td style="text-align: right;">
                <button class="btn btn-sm btn-secondary" (click)="viewOrderDetails(o)">
                  Inspect
                </button>
                <button *ngIf="o.status === 'APPROVAL_PENDING' && authService.hasRole(['SALES_MANAGER', 'TENANT_ADMIN', 'ADMIN'])" 
                        class="btn btn-sm btn-primary" 
                        style="margin-left: 6px;"
                        (click)="approveOrder(o.id)">
                  Approve
                </button>
                <button *ngIf="(o.status === 'DRAFT' || o.status === 'APPROVED') && authService.hasRole(['SALES', 'SALES_EXECUTIVE', 'SALES_MANAGER', 'TENANT_ADMIN', 'ADMIN'])" 
                        class="btn btn-sm btn-success" 
                        style="margin-left: 6px;"
                        (click)="confirmOrder(o.id)">
                  Confirm
                </button>
              </td>
            </tr>
            <tr *ngIf="filteredOrders.length === 0">
              <td colspan="10" style="text-align: center; padding: 40px; color: var(--slate-400);">
                No sales orders found matching filters
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Create Sales Order Modal -->
      <div *ngIf="showCreateModal" class="modal-overlay">
        <div class="modal-content" style="max-width: 800px;">
          <div class="modal-header">
            <h3 style="font-size: 1.15rem; font-weight: 700;">Create Sales Order (OTC Workflow)</h3>
            <button (click)="showCreateModal = false" style="background: none; border: none; font-size: 1.25rem; cursor: pointer;">&times;</button>
          </div>
          <div class="modal-body">
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 16px; margin-bottom: 20px;">
              <div class="form-group">
                <label class="form-label">Select Customer *</label>
                <select [(ngModel)]="newOrderCustomerId" class="form-select">
                  <option [ngValue]="null">-- Choose Client --</option>
                  <option *ngFor="let c of customers" [ngValue]="c.id">{{ c.name }} ({{ c.city }})</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Expected Delivery Date</label>
                <input type="date" [(ngModel)]="newOrderDeliveryDate" class="form-control" />
              </div>
            </div>

            <div style="font-weight: 700; font-size: 0.875rem; margin-bottom: 10px;">Order Line Items (Finished Goods)</div>
            <div class="table-container" style="margin-bottom: 16px;">
              <table class="oc-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Unit Price ({{ authService.currencySymbol }})</th>
                    <th>Qty</th>
                    <th>Subtotal ({{ authService.currencySymbol }})</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of orderDraftItems; let i = index">
                    <td>
                      <select [(ngModel)]="item.productId" (ngModelChange)="onItemProductChange(item)" class="form-select">
                        <option *ngFor="let p of finishedGoods" [ngValue]="p.id">{{ p.name }} ({{ p.sku }})</option>
                      </select>
                    </td>
                    <td class="text-mono">{{ authService.currencySymbol }}{{ item.unitPrice | number:'1.2-2' }}</td>
                    <td style="width: 110px;">
                      <input type="number" [(ngModel)]="item.quantity" min="1" class="form-control" style="padding: 4px 8px;" />
                    </td>
                    <td class="text-mono" style="font-weight: 700;">{{ authService.currencySymbol }}{{ (item.quantity * item.unitPrice) | number:'1.2-2' }}</td>
                    <td style="text-align: right;">
                      <button *ngIf="orderDraftItems.length > 1" (click)="removeItem(i)" class="btn btn-sm btn-danger">&times;</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <button type="button" class="btn btn-sm btn-secondary" (click)="addItem()">+ Add Product Line</button>

            <!-- Order Totals Box -->
            <div class="totals-summary-box">
              <div class="summary-line">
                <span>Subtotal:</span>
                <span class="text-mono">{{ authService.currencySymbol }}{{ calculateSubtotal() | number:'1.2-2' }}</span>
              </div>
              <div class="summary-line">
                <span>Taxes:</span>
                <span class="text-mono">{{ authService.currencySymbol }}{{ calculateTax() | number:'1.2-2' }}</span>
              </div>
              <div class="summary-line total-highlight">
                <span>Grand Total:</span>
                <span class="text-mono">{{ authService.currencySymbol }}{{ calculateTotal() | number:'1.2-2' }}</span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showCreateModal = false">Cancel</button>
            <button class="btn btn-primary" [disabled]="!canSubmitOrder()" (click)="submitOrder()">
              Save Sales Order (Draft)
            </button>
          </div>
        </div>
      </div>

      <!-- Rich Order Details & Inspection Modal (Section 35) -->
      <div *ngIf="selectedOrder" class="modal-overlay">
        <div class="modal-content" style="max-width: 860px;">
          <div class="modal-header">
            <div>
              <h3 style="font-size: 1.2rem; font-weight: 800; display: inline-flex; align-items: center; gap: 10px;">
                {{ selectedOrder.orderNumber }}
                <span class="badge" [ngClass]="'badge-' + selectedOrder.status.toLowerCase()">{{ selectedOrder.status }}</span>
              </h3>
              <div style="font-size: 0.8125rem; color: var(--slate-500); margin-top: 2px;">
                Placed by: {{ selectedOrder.customerName }} • Date: {{ selectedOrder.orderDate | date:'mediumDate' }}
              </div>
            </div>
            <button (click)="selectedOrder = null" style="background: none; border: none; font-size: 1.25rem; cursor: pointer;">&times;</button>
          </div>
          <div class="modal-body">
            <!-- Timeline progression -->
            <div class="order-progression-bar">
              <div class="prog-node" [class.done]="isStateDone('DRAFT')">
                <span class="node-circle">1</span>
                <span>Draft</span>
              </div>
              <div class="prog-line" [class.done]="isStateDone('CONFIRMED')"></div>
              <div class="prog-node" [class.done]="isStateDone('CONFIRMED')">
                <span class="node-circle">2</span>
                <span>Confirmed</span>
              </div>
              <div class="prog-line" [class.done]="isStateDone('IN_PROGRESS')"></div>
              <div class="prog-node" [class.done]="isStateDone('IN_PROGRESS')">
                <span class="node-circle">3</span>
                <span>Production</span>
              </div>
              <div class="prog-line" [class.done]="isStateDone('COMPLETED')"></div>
              <div class="prog-node" [class.done]="isStateDone('COMPLETED')">
                <span class="node-circle">4</span>
                <span>Fulfilled</span>
              </div>
            </div>

            <!-- Items Breakdown Table -->
            <div style="font-weight: 700; font-size: 0.9rem; margin-bottom: 8px;">Order Line Items</div>
            <div class="table-container" style="margin-bottom: 20px;">
              <table class="oc-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of selectedOrder.items">
                    <td style="font-weight: 600;">{{ item.productName }}</td>
                    <td class="text-mono">{{ item.productSku }}</td>
                    <td>{{ item.quantity }} {{ item.unit }}</td>
                    <td class="text-mono">{{ authService.currencySymbol }}{{ item.unitPrice | number:'1.2-2' }}</td>
                    <td class="text-mono" style="font-weight: 700;">{{ authService.currencySymbol }}{{ item.totalPrice | number:'1.2-2' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Material Availability & BOM Inspection -->
            <div *ngIf="bomRequirements.length > 0" class="oc-card" style="padding: 16px; margin-bottom: 20px; background: var(--slate-50);">
              <div style="font-weight: 700; font-size: 0.875rem; color: var(--slate-900); margin-bottom: 6px;">
                BOM Requirements & Component Availability Check
              </div>
              <div style="font-size: 0.75rem; color: var(--slate-500); margin-bottom: 12px;">
                Bill of materials explosion calculated for ordered batch quantity
              </div>
              <div class="table-container" style="background: #ffffff;">
                <table class="oc-table">
                  <thead>
                    <tr>
                      <th>Component</th>
                      <th>Per Unit Req</th>
                      <th>Total Required</th>
                      <th>In Stock</th>
                      <th>Shortage</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let req of bomRequirements">
                      <td>{{ req.materialName }}</td>
                      <td>{{ req.unitRequirement }} {{ req.unit }}</td>
                      <td style="font-weight: 600;">{{ req.totalRequired }} {{ req.unit }}</td>
                      <td>{{ req.availableStock }} {{ req.unit }}</td>
                      <td style="color: var(--danger); font-weight: 600;">
                        {{ req.shortageQuantity > 0 ? (req.shortageQuantity + ' ' + req.unit) : '0' }}
                      </td>
                      <td>
                        <span class="badge" [ngClass]="req.isSufficient ? 'badge-success' : 'badge-danger'">
                          {{ req.isSufficient ? 'SUFFICIENT' : 'SHORTAGE' }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Real-world Auto Requisition Trigger -->
              <div *ngIf="hasShortages()" style="margin-top: 14px; display: flex; justify-content: flex-end;">
                <button type="button" class="btn btn-sm btn-warning flex-center gap-1" (click)="autoCreatePoForShortages()">
                  ⚡ Auto-Generate Purchase Order for Shortages
                </button>
              </div>
            </div>

            <!-- Associated Work Order & Invoice status boxes -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div class="oc-card" style="padding: 14px;">
                <span style="font-size: 0.75rem; font-weight: 700; color: var(--slate-500);">SHOP-FLOOR WORK ORDER</span>
                <div *ngIf="selectedOrder.associatedWorkOrderNumber" style="margin-top: 6px;">
                  <span class="text-mono" style="font-weight: 700; color: var(--primary);">{{ selectedOrder.associatedWorkOrderNumber }}</span>
                  <div style="font-size: 0.75rem; color: var(--slate-600); margin-top: 2px;">Assigned to assembly line</div>
                </div>
                <div *ngIf="!selectedOrder.associatedWorkOrderNumber" style="font-size: 0.8125rem; color: var(--slate-400); margin-top: 6px;">
                  Will auto-generate upon order confirmation
                </div>
              </div>

              <div class="oc-card" style="padding: 14px;">
                <span style="font-size: 0.75rem; font-weight: 700; color: var(--slate-500);">FINANCIAL INVOICE</span>
                <div *ngIf="selectedOrder.associatedInvoiceNumber" style="margin-top: 6px;">
                  <span class="text-mono" style="font-weight: 700; color: var(--success);">{{ selectedOrder.associatedInvoiceNumber }}</span>
                  <div style="font-size: 0.75rem; color: var(--slate-600); margin-top: 2px;">Issued to accounts payable</div>
                </div>
                <div *ngIf="!selectedOrder.associatedInvoiceNumber" style="font-size: 0.8125rem; color: var(--slate-400); margin-top: 6px;">
                  Eligible upon production completion
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="selectedOrder = null">Close</button>
            <button *ngIf="selectedOrder.status !== 'CANCELLED' && selectedOrder.status !== 'COMPLETED' && authService.hasRole(['SALES', 'ADMIN'])" 
                    class="btn btn-danger" 
                    (click)="cancelOrder(selectedOrder.id)">
              Cancel Order
            </button>
            <button *ngIf="selectedOrder.status === 'DRAFT' && authService.hasRole(['SALES', 'ADMIN'])" 
                    class="btn btn-success" 
                    (click)="confirmOrder(selectedOrder.id)">
              Confirm Order & Trigger Production
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

    .totals-summary-box {
      margin-top: 16px;
      padding: 16px;
      background: var(--slate-50);
      border-radius: 8px;
      border: 1px solid var(--slate-200);
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 320px;
      margin-left: auto;
    }

    .summary-line {
      display: flex;
      justify-content: space-between;
      font-size: 0.8125rem;
      color: var(--slate-600);
    }

    .total-highlight {
      font-size: 1rem;
      font-weight: 800;
      color: var(--slate-900);
      border-top: 1px solid var(--slate-200);
      padding-top: 8px;
    }

    .order-progression-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
      padding: 16px;
      background: var(--slate-50);
      border-radius: 8px;
    }

    .prog-node {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--slate-400);
    }

    .prog-node.done {
      color: var(--primary);
    }

    .node-circle {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--slate-200);
      color: var(--slate-600);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
    }

    .prog-node.done .node-circle {
      background: var(--primary);
      color: #ffffff;
    }

    .prog-line {
      flex: 1;
      height: 3px;
      background: var(--slate-200);
      margin: 0 12px;
      margin-bottom: 20px;
    }

    .prog-line.done {
      background: var(--primary);
    }
  `]
})
export class OrdersComponent implements OnInit {
  orders: SalesOrder[] = [];
  customers: Customer[] = [];
  products: Product[] = [];
  finishedGoods: Product[] = [];

  searchQuery = '';
  statusFilter = 'ALL';

  showCreateModal = false;
  selectedOrder: SalesOrder | null = null;
  bomRequirements: BomExplosionItem[] = [];

  // Create Form models
  newOrderCustomerId: number | null = null;
  newOrderDeliveryDate = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
  orderDraftItems: { productId: number; quantity: number; unitPrice: number }[] = [];

  constructor(
    private dataService: OrdercraftDataService,
    public authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.dataService.salesOrders$.subscribe(list => this.orders = list);
    this.dataService.customers$.subscribe(list => this.customers = list.filter(c => c.status === 'ACTIVE'));
    this.dataService.products$.subscribe(list => {
      this.products = list;
      this.finishedGoods = list.filter(p => p.category === 'FINISHED_GOOD');
    });

    this.route.queryParams.subscribe(params => {
      if (params['customerId']) {
        this.openCreateModal(Number(params['customerId']));
      }
    });
  }

  get filteredOrders(): SalesOrder[] {
    return this.orders.filter(o => {
      const matchSearch = !this.searchQuery ||
        o.orderNumber.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        o.customerName.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchStatus = this.statusFilter === 'ALL' || o.status === this.statusFilter;
      return matchSearch && matchStatus;
    });
  }

  openCreateModal(customerId?: number): void {
    this.newOrderCustomerId = customerId || (this.customers[0]?.id || null);
    this.newOrderDeliveryDate = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
    const defaultProduct = this.finishedGoods[0] || this.products[0];
    this.orderDraftItems = [
      { productId: defaultProduct ? defaultProduct.id : 1, quantity: 2, unitPrice: defaultProduct ? defaultProduct.unitPrice : 45000 }
    ];
    this.showCreateModal = true;
  }

  onItemProductChange(item: any): void {
    const prod = this.products.find(p => p.id === item.productId);
    if (prod) {
      item.unitPrice = prod.unitPrice;
    }
  }

  addItem(): void {
    const defaultProduct = this.finishedGoods[0] || this.products[0];
    this.orderDraftItems.push({
      productId: defaultProduct ? defaultProduct.id : 1,
      quantity: 1,
      unitPrice: defaultProduct ? defaultProduct.unitPrice : 0
    });
  }

  removeItem(index: number): void {
    this.orderDraftItems.splice(index, 1);
  }

  calculateSubtotal(): number {
    return this.orderDraftItems.reduce((acc, it) => acc + (it.quantity * it.unitPrice), 0);
  }

  calculateTax(): number {
    return Math.round(this.calculateSubtotal() * 0.18 * 100) / 100;
  }

  calculateTotal(): number {
    return this.calculateSubtotal() + this.calculateTax();
  }

  canSubmitOrder(): boolean {
    return !!this.newOrderCustomerId && 
           this.orderDraftItems.length > 0 && 
           this.orderDraftItems.every(i => i.quantity > 0 && i.unitPrice >= 0);
  }

  submitOrder(): void {
    if (!this.canSubmitOrder()) return;

    this.dataService.createSalesOrder({
      customerId: this.newOrderCustomerId!,
      expectedDeliveryDate: this.newOrderDeliveryDate,
      items: this.orderDraftItems
    });

    this.showCreateModal = false;
  }

  viewOrderDetails(order: SalesOrder): void {
    this.selectedOrder = order;
    if (order.items.length > 0) {
      this.bomRequirements = this.dataService.calculateBomRequirements(order.items[0].productId, order.items[0].quantity);
    } else {
      this.bomRequirements = [];
    }
  }

  approveOrder(orderId: number): void {
    this.dataService.approveSalesOrder(orderId);
    if (this.selectedOrder && this.selectedOrder.id === orderId) {
      const updated = this.orders.find(o => o.id === orderId);
      if (updated) this.selectedOrder = updated;
    }
  }

  confirmOrder(orderId: number): void {
    this.dataService.confirmSalesOrder(orderId);
    if (this.selectedOrder && this.selectedOrder.id === orderId) {
      const updated = this.orders.find(o => o.id === orderId);
      if (updated) this.selectedOrder = updated;
    }
  }

  hasShortages(): boolean {
    return this.bomRequirements.some(r => r.shortageQuantity > 0);
  }

  autoCreatePoForShortages(): void {
    if (!this.hasShortages()) return;
    try {
      const po = this.dataService.createPoFromShortages(this.bomRequirements);
      this.selectedOrder = null;
      this.router.navigate(['/purchase-orders']);
    } catch (e) {
      console.error(e);
    }
  }

  cancelOrder(orderId: number): void {
    if (confirm('Are you sure you want to cancel this sales order?')) {
      this.dataService.cancelSalesOrder(orderId);
      if (this.selectedOrder) {
        this.selectedOrder.status = 'CANCELLED';
      }
    }
  }

  isStateDone(state: string): boolean {
    if (!this.selectedOrder) return false;
    const s = this.selectedOrder.status;
    if (s === 'CANCELLED') return false;
    if (state === 'DRAFT') return true;
    if (state === 'CONFIRMED') return ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(s);
    if (state === 'IN_PROGRESS') return ['IN_PROGRESS', 'COMPLETED'].includes(s);
    if (state === 'COMPLETED') return s === 'COMPLETED';
    return false;
  }
}
