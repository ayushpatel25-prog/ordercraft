import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrdercraftDataService } from '../../core/services/ordercraft-data.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { SalesOrder, WorkOrder, Inventory, Invoice, Payment } from '../../core/models/models';

type ReportType = 'SALES' | 'PRODUCTION' | 'INVENTORY' | 'FINANCIAL';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header flex-between mb-4">
        <div>
          <h1 class="page-title">Executive & Operational Reports</h1>
          <p class="text-secondary text-sm">Real-time analytical reporting across Order-to-Cash and Procure-to-Pay pipelines</p>
        </div>
        <div class="flex-center gap-2">
          <button class="btn btn-outline flex-center gap-1" (click)="exportToCsv()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Export to CSV
          </button>
        </div>
      </div>

      <!-- Report Type Selector Tabs -->
      <div class="card p-2 mb-4">
        <div class="flex-wrap gap-2 flex-center" style="justify-content: flex-start;">
          <button class="tab-btn" [class.active]="activeTab === 'SALES'" (click)="activeTab = 'SALES'">
            📊 Sales & Revenue
          </button>
          <button class="tab-btn" [class.active]="activeTab === 'PRODUCTION'" (click)="activeTab = 'PRODUCTION'">
            🏭 Production & Shop Floor
          </button>
          <button class="tab-btn" [class.active]="activeTab === 'INVENTORY'" (click)="activeTab = 'INVENTORY'">
            📦 Inventory & Valuation
          </button>
          <button class="tab-btn" [class.active]="activeTab === 'FINANCIAL'" (click)="activeTab = 'FINANCIAL'">
            💰 Financial & Receivables
          </button>
        </div>
      </div>

      <!-- TAB 1: SALES & REVENUE -->
      <div *ngIf="activeTab === 'SALES'">
        <div class="grid grid-4 mb-4">
          <div class="card p-3">
            <span class="text-secondary text-xs font-semibold">TOTAL SALES ORDERS</span>
            <h2 class="mt-1 font-bold">{{ salesOrders.length }}</h2>
          </div>
          <div class="card p-3">
            <span class="text-secondary text-xs font-semibold">GROSS BOOKINGS</span>
            <h2 class="mt-1 font-bold text-primary">{{ authService.currencySymbol }}{{ getSalesTotal() | number:'1.2-2' }}</h2>
          </div>
          <div class="card p-3">
            <span class="text-secondary text-xs font-semibold">COMPLETED ORDERS</span>
            <h2 class="mt-1 font-bold text-success">{{ getOrdersByStatus('COMPLETED') }}</h2>
          </div>
          <div class="card p-3">
            <span class="text-secondary text-xs font-semibold">ACTIVE IN PIPELINE</span>
            <h2 class="mt-1 font-bold text-warning">{{ getOrdersByStatus('CONFIRMED') + getOrdersByStatus('IN_PROGRESS') }}</h2>
          </div>
        </div>

        <div class="card p-0">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Order Date</th>
                  <th>Items Count</th>
                  <th>Subtotal</th>
                  <th>Tax (GST 18%)</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let order of salesOrders">
                  <td class="font-bold">{{ order.orderNumber }}</td>
                  <td>{{ order.customerName }}</td>
                  <td>{{ order.orderDate | date:'mediumDate' }}</td>
                  <td>{{ order.items.length }} line(s)</td>
                  <td>{{ authService.currencySymbol }}{{ order.subtotal | number:'1.2-2' }}</td>
                  <td>{{ authService.currencySymbol }}{{ order.taxAmount | number:'1.2-2' }}</td>
                  <td class="font-bold">{{ authService.currencySymbol }}{{ order.totalAmount | number:'1.2-2' }}</td>
                  <td>
                    <span class="badge" [ngClass]="{
                      'badge-info': order.status === 'DRAFT',
                      'badge-primary': order.status === 'CONFIRMED',
                      'badge-warning': order.status === 'IN_PROGRESS',
                      'badge-success': order.status === 'COMPLETED'
                    }">{{ order.status }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 2: PRODUCTION & SHOP FLOOR -->
      <div *ngIf="activeTab === 'PRODUCTION'">
        <div class="grid grid-4 mb-4">
          <div class="card p-3">
            <span class="text-secondary text-xs font-semibold">WORK ORDERS ISSUED</span>
            <h2 class="mt-1 font-bold">{{ workOrders.length }}</h2>
          </div>
          <div class="card p-3">
            <span class="text-secondary text-xs font-semibold">IN EXECUTION</span>
            <h2 class="mt-1 font-bold text-warning">{{ getWorkOrdersByStatus('IN_PROGRESS') }}</h2>
          </div>
          <div class="card p-3">
            <span class="text-secondary text-xs font-semibold">FINISHED GOODS PRODUCED</span>
            <h2 class="mt-1 font-bold text-success">{{ getProductionCompletedUnits() }} units</h2>
          </div>
          <div class="card p-3">
            <span class="text-secondary text-xs font-semibold">AVERAGE COMPLETION</span>
            <h2 class="mt-1 font-bold text-info">{{ getAvgProductionProgress() | number:'1.0-1' }}%</h2>
          </div>
        </div>

        <div class="card p-0">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Work Order #</th>
                  <th>Target Product</th>
                  <th>Batch Qty</th>
                  <th>Assigned Lead</th>
                  <th>Schedule</th>
                  <th>Shop Floor Progress</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let wo of workOrders">
                  <td class="font-bold">{{ wo.workOrderNumber }}</td>
                  <td>
                    <div class="font-semibold">{{ wo.productName }}</div>
                    <span class="text-secondary text-xs">{{ wo.productSku }}</span>
                  </td>
                  <td>{{ wo.quantity }}</td>
                  <td>{{ wo.assignedTo || 'Unassigned' }}</td>
                  <td>{{ wo.startDate | date:'shortDate' }} → {{ wo.expectedEndDate | date:'shortDate' }}</td>
                  <td>
                    <div class="flex-center gap-2">
                      <div class="progress-bar-container">
                        <div class="progress-bar-fill" [style.width.%]="wo.progressPercentage"></div>
                      </div>
                      <span class="text-xs font-bold">{{ wo.progressPercentage }}%</span>
                    </div>
                  </td>
                  <td>
                    <span class="badge" [ngClass]="{
                      'badge-info': wo.status === 'PLANNED',
                      'badge-warning': wo.status === 'IN_PROGRESS',
                      'badge-success': wo.status === 'COMPLETED'
                    }">{{ wo.status }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 3: INVENTORY & VALUATION -->
      <div *ngIf="activeTab === 'INVENTORY'">
        <div class="grid grid-4 mb-4">
          <div class="card p-3">
            <span class="text-secondary text-xs font-semibold">TOTAL TRACKED SKUS</span>
            <h2 class="mt-1 font-bold">{{ inventoryItems.length }}</h2>
          </div>
          <div class="card p-3">
            <span class="text-secondary text-xs font-semibold">TOTAL STOCK VALUATION</span>
            <h2 class="mt-1 font-bold text-success">{{ authService.currencySymbol }}{{ getTotalInventoryValuation() | number:'1.2-2' }}</h2>
          </div>
          <div class="card p-3">
            <span class="text-secondary text-xs font-semibold">CRITICAL REORDER ITEMS</span>
            <h2 class="mt-1 font-bold text-danger">{{ getLowStockCount() }}</h2>
          </div>
          <div class="card p-3">
            <span class="text-secondary text-xs font-semibold">RESERVED ALLOCATIONS</span>
            <h2 class="mt-1 font-bold text-warning">{{ getTotalReservedStock() }} items</h2>
          </div>
        </div>

        <div class="card p-0">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product / Material</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Allocated / Reserved</th>
                  <th>Net Available</th>
                  <th>Unit Value</th>
                  <th>Estimated Valuation</th>
                  <th>Health</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of inventoryItems">
                  <td class="font-bold">{{ item.productName }}</td>
                  <td><code>{{ item.productSku }}</code></td>
                  <td><span class="badge badge-info">{{ item.productCategory }}</span></td>
                  <td class="font-semibold">{{ (item.currentStock ?? item.quantity) }} {{ item.unit }}</td>
                  <td class="text-warning">{{ item.reservedQuantity }} {{ item.unit }}</td>
                  <td class="font-bold text-success">{{ item.availableQuantity }} {{ item.unit }}</td>
                  <td>{{ authService.currencySymbol }}{{ (item.unitPrice || 0) | number:'1.2-2' }}</td>
                  <td class="font-bold">{{ authService.currencySymbol }}{{ ((item.currentStock ?? item.quantity) * (item.unitPrice || 0)) | number:'1.2-2' }}</td>
                  <td>
                    <span class="badge" [ngClass]="{
                      'badge-success': item.status === 'IN_STOCK',
                      'badge-warning': item.status === 'LOW_STOCK',
                      'badge-danger': item.status === 'OUT_OF_STOCK'
                    }">{{ item.status }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 4: FINANCIAL & RECEIVABLES -->
      <div *ngIf="activeTab === 'FINANCIAL'">
        <div class="grid grid-4 mb-4">
          <div class="card p-3">
            <span class="text-secondary text-xs font-semibold">TOTAL BILLED VALUE</span>
            <h2 class="mt-1 font-bold">{{ authService.currencySymbol }}{{ getTotalBilled() | number:'1.2-2' }}</h2>
          </div>
          <div class="card p-3">
            <span class="text-secondary text-xs font-semibold">SETTLED COLLECTIONS</span>
            <h2 class="mt-1 font-bold text-success">{{ authService.currencySymbol }}{{ getTotalCollected() | number:'1.2-2' }}</h2>
          </div>
          <div class="card p-3">
            <span class="text-secondary text-xs font-semibold">OUTSTANDING RECEIVABLES</span>
            <h2 class="mt-1 font-bold text-danger">{{ authService.currencySymbol }}{{ getTotalReceivables() | number:'1.2-2' }}</h2>
          </div>
          <div class="card p-3">
            <span class="text-secondary text-xs font-semibold">COLLECTION RATIO</span>
            <h2 class="mt-1 font-bold text-primary">{{ getCollectionRatio() | number:'1.1-1' }}%</h2>
          </div>
        </div>

        <div class="card p-0">
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Order Ref</th>
                  <th>Invoice Date</th>
                  <th>Total Billed</th>
                  <th>Amount Paid</th>
                  <th>Outstanding Balance</th>
                  <th>Payment Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let inv of invoices">
                  <td class="font-bold">{{ inv.invoiceNumber }}</td>
                  <td>{{ inv.customerName }}</td>
                  <td><code>{{ inv.salesOrderNumber }}</code></td>
                  <td>{{ inv.createdAt | date:'mediumDate' }}</td>
                  <td>{{ authService.currencySymbol }}{{ inv.totalAmount | number:'1.2-2' }}</td>
                  <td class="text-success font-semibold">{{ authService.currencySymbol }}{{ inv.paidAmount | number:'1.2-2' }}</td>
                  <td class="font-bold" [class.text-danger]="inv.remainingAmount > 0">{{ authService.currencySymbol }}{{ inv.remainingAmount | number:'1.2-2' }}</td>
                  <td>
                    <span class="badge" [ngClass]="{
                      'badge-info': inv.status === 'ISSUED',
                      'badge-warning': inv.status === 'PARTIALLY_PAID',
                      'badge-success': inv.status === 'PAID',
                      'badge-danger': inv.status === 'CANCELLED'
                    }">{{ inv.status }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tab-btn {
      padding: 10px 16px;
      font-size: 0.875rem;
      font-weight: 600;
      border: 1px solid transparent;
      border-radius: 6px;
      background: #f1f5f9;
      color: #475569;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .tab-btn:hover {
      background: #e2e8f0;
      color: #0f172a;
    }
    .tab-btn.active {
      background: #2563eb;
      color: #ffffff;
      border-color: #1d4ed8;
      box-shadow: 0 2px 4px rgba(37, 99, 235, 0.25);
    }
    .progress-bar-container {
      width: 80px;
      height: 8px;
      background: #e2e8f0;
      border-radius: 9999px;
      overflow: hidden;
    }
    .progress-bar-fill {
      height: 100%;
      background: #10b981;
      border-radius: 9999px;
    }
  `]
})
export class ReportsComponent implements OnInit {
  activeTab: ReportType = 'SALES';

  salesOrders: SalesOrder[] = [];
  workOrders: WorkOrder[] = [];
  inventoryItems: Inventory[] = [];
  invoices: Invoice[] = [];
  payments: Payment[] = [];

  constructor(
    private dataService: OrdercraftDataService,
    public authService: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.dataService.salesOrders$.subscribe(orders => this.salesOrders = orders);
    this.dataService.workOrders$.subscribe(wos => this.workOrders = wos);
    this.dataService.inventory$.subscribe(inv => this.inventoryItems = inv);
    this.dataService.invoices$.subscribe(invoices => this.invoices = invoices);
    this.dataService.payments$.subscribe(payments => this.payments = payments);
  }

  // Sales metrics
  getSalesTotal(): number {
    return this.salesOrders.reduce((sum, o) => sum + (o.status !== 'CANCELLED' ? o.totalAmount : 0), 0);
  }

  getOrdersByStatus(status: string): number {
    return this.salesOrders.filter(o => o.status === status).length;
  }

  // Production metrics
  getWorkOrdersByStatus(status: string): number {
    return this.workOrders.filter(w => w.status === status).length;
  }

  getProductionCompletedUnits(): number {
    return this.workOrders
      .filter(w => w.status === 'COMPLETED')
      .reduce((sum, w) => sum + w.quantity, 0);
  }

  getAvgProductionProgress(): number {
    if (!this.workOrders.length) return 0;
    const total = this.workOrders.reduce((sum, w) => sum + w.progressPercentage, 0);
    return total / this.workOrders.length;
  }

  // Inventory metrics
  getTotalInventoryValuation(): number {
    return this.inventoryItems.reduce((sum, i) => sum + ((i.currentStock ?? i.quantity) * (i.unitPrice || 0)), 0);
  }

  getLowStockCount(): number {
    return this.inventoryItems.filter(i => i.status === 'LOW_STOCK' || i.status === 'OUT_OF_STOCK').length;
  }

  getTotalReservedStock(): number {
    return this.inventoryItems.reduce((sum, i) => sum + i.reservedQuantity, 0);
  }

  // Financial metrics
  getTotalBilled(): number {
    return this.invoices.reduce((sum, i) => sum + (i.status !== 'CANCELLED' ? i.totalAmount : 0), 0);
  }

  getTotalCollected(): number {
    return this.invoices.reduce((sum, i) => sum + i.paidAmount, 0);
  }

  getTotalReceivables(): number {
    return this.invoices.reduce((sum, i) => sum + i.remainingAmount, 0);
  }

  getCollectionRatio(): number {
    const billed = this.getTotalBilled();
    if (billed === 0) return 100;
    return (this.getTotalCollected() / billed) * 100;
  }

  // CSV Export utility
  exportToCsv(): void {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = `OrderCraft_${this.activeTab}_Report_${new Date().toISOString().slice(0, 10)}.csv`;

    if (this.activeTab === 'SALES') {
      headers = ['Order Number', 'Customer', 'Date', 'Subtotal', 'Tax (GST)', 'Total Amount', 'Status'];
      rows = this.salesOrders.map(o => [
        o.orderNumber,
        `"${o.customerName.replace(/"/g, '""')}"`,
        o.orderDate,
        o.subtotal.toString(),
        o.taxAmount.toString(),
        o.totalAmount.toString(),
        o.status
      ]);
    } else if (this.activeTab === 'PRODUCTION') {
      headers = ['Work Order Number', 'Product Name', 'SKU', 'Quantity', 'Progress %', 'Start Date', 'Expected End Date', 'Status'];
      rows = this.workOrders.map(w => [
        w.workOrderNumber,
        `"${w.productName.replace(/"/g, '""')}"`,
        w.productSku,
        w.quantity.toString(),
        w.progressPercentage.toString(),
        w.startDate,
        w.expectedEndDate,
        w.status
      ]);
    } else if (this.activeTab === 'INVENTORY') {
      headers = ['Product Name', 'SKU', 'Category', 'Current Stock', 'Reserved Qty', 'Available Qty', 'Unit Price', 'Stock Valuation', 'Status'];
      rows = this.inventoryItems.map(i => {
        const qty = i.currentStock ?? i.quantity;
        const price = i.unitPrice || 0;
        return [
          `"${i.productName.replace(/"/g, '""')}"`,
          i.productSku,
          i.productCategory,
          qty.toString(),
          i.reservedQuantity.toString(),
          i.availableQuantity.toString(),
          price.toString(),
          (qty * price).toString(),
          i.status
        ];
      });
    } else if (this.activeTab === 'FINANCIAL') {
      headers = ['Invoice Number', 'Customer', 'Sales Order Number', 'Total Amount', 'Paid Amount', 'Remaining Balance', 'Status', 'Date'];
      rows = this.invoices.map(inv => [
        inv.invoiceNumber,
        `"${inv.customerName.replace(/"/g, '""')}"`,
        inv.salesOrderNumber,
        inv.totalAmount.toString(),
        inv.paidAmount.toString(),
        inv.remainingAmount.toString(),
        inv.status,
        inv.createdAt
      ]);
    }

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.toast.success(`Exported ${this.activeTab} Report to CSV.`);
  }
}
