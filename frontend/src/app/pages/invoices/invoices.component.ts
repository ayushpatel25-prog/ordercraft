import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrdercraftDataService } from '../../core/services/ordercraft-data.service';
import { AuthService } from '../../core/services/auth.service';
import { Invoice, SalesOrder } from '../../core/models/models';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Invoicing & Accounts Receivable</h1>
          <p class="page-subtitle">Generate GST tax invoices from completed orders and track payments settlement</p>
        </div>
        <button *ngIf="authService.hasRole(['FINANCE_OFFICER', 'ADMIN'])" 
                class="btn btn-primary" 
                (click)="openGenerateModal()">
          + Generate Invoice
        </button>
      </div>

      <!-- Toolbar -->
      <div class="toolbar oc-card">
        <div style="flex: 1; min-width: 260px;">
          <input type="text" [(ngModel)]="searchQuery" placeholder="Search Invoice # or Customer..." class="form-control" />
        </div>
        <select [(ngModel)]="statusFilter" class="form-select" style="width: 170px;">
          <option value="ALL">All Statuses</option>
          <option value="ISSUED">ISSUED</option>
          <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
          <option value="PAID">PAID</option>
          <option value="OVERDUE">OVERDUE</option>
        </select>
      </div>

      <!-- Invoices Table -->
      <div class="table-container oc-card">
        <table class="oc-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Customer</th>
              <th>Order Ref</th>
              <th>Invoice Date</th>
              <th>Due Date</th>
              <th>Total Amount</th>
              <th>Paid Amount</th>
              <th>Remaining Balance</th>
              <th>Status</th>
              <th style="text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let inv of filteredInvoices">
              <td class="text-mono" style="font-weight: 700; color: var(--primary);">{{ inv.invoiceNumber }}</td>
              <td style="font-weight: 600;">{{ inv.customerName }}</td>
              <td class="text-mono">{{ inv.salesOrderNumber }}</td>
              <td>{{ inv.invoiceDate | date:'mediumDate' }}</td>
              <td>{{ inv.dueDate | date:'mediumDate' }}</td>
              <td class="text-mono" style="font-weight: 700;">{{ authService.currencySymbol }}{{ inv.totalAmount | number:'1.2-2' }}</td>
              <td class="text-mono" style="color: var(--success); font-weight: 600;">{{ authService.currencySymbol }}{{ inv.paidAmount | number:'1.2-2' }}</td>
              <td class="text-mono" [style.color]="inv.remainingAmount > 0 ? 'var(--danger)' : 'var(--slate-500)'" style="font-weight: 700;">
                {{ authService.currencySymbol }}{{ inv.remainingAmount | number:'1.2-2' }}
              </td>
              <td>
                <span class="badge" [ngClass]="'badge-' + inv.status.toLowerCase()">
                  {{ inv.status.replace('_', ' ') }}
                </span>
              </td>
              <td style="text-align: right;">
                <button class="btn btn-sm btn-secondary" (click)="viewPrintableInvoice(inv)">View / Print</button>
                <button *ngIf="inv.remainingAmount > 0 && authService.hasRole(['FINANCE_OFFICER', 'ADMIN'])" 
                        class="btn btn-sm btn-success" 
                        style="margin-left: 6px;"
                        (click)="openPaymentModal(inv)">
                  Record Payment
                </button>
              </td>
            </tr>
            <tr *ngIf="filteredInvoices.length === 0">
              <td colspan="10" style="text-align: center; padding: 40px; color: var(--slate-400);">No invoices found</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Professional Printable Invoice Modal (Section 38) -->
      <div *ngIf="selectedInvoice" class="modal-overlay">
        <div class="modal-content invoice-printable" style="max-width: 800px; padding: 32px;">
          <!-- Actions Header (hidden in print) -->
          <div class="no-print" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 1px solid var(--slate-200);">
            <div style="font-weight: 700; color: var(--slate-500); font-size: 0.8125rem;">PREVIEW TAX INVOICE</div>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-secondary btn-sm" (click)="printInvoice()">🖨 Print Invoice</button>
              <button class="btn btn-sm btn-secondary" (click)="selectedInvoice = null">Close</button>
            </div>
          </div>

          <!-- Invoice Document Header -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
            <div>
              <div style="font-size: 1.6rem; font-weight: 900; color: var(--primary); letter-spacing: -0.03em;">ORDERCRAFT</div>
              <div style="font-size: 0.8125rem; font-weight: 600; color: var(--slate-700);">Manufacturing Systems Pvt Ltd</div>
              <div style="font-size: 0.75rem; color: var(--slate-500); margin-top: 2px;">
                Plot 104, Technology Park, Phase 1<br/>
                Pune, Maharashtra - 411057<br/>
                GSTIN: 27AABCO1234F1Z8
              </div>
            </div>
            <div style="text-align: right;">
              <h2 style="font-size: 1.4rem; font-weight: 800; color: var(--slate-900);">TAX INVOICE</h2>
              <div class="text-mono" style="font-size: 1rem; font-weight: 700; color: var(--primary);">{{ selectedInvoice.invoiceNumber }}</div>
              <div style="font-size: 0.75rem; color: var(--slate-500); margin-top: 4px;">
                Invoice Date: {{ selectedInvoice.invoiceDate | date:'mediumDate' }}<br/>
                Payment Due Date: {{ selectedInvoice.dueDate | date:'mediumDate' }}<br/>
                Sales Order Ref: <strong>{{ selectedInvoice.salesOrderNumber }}</strong>
              </div>
            </div>
          </div>

          <!-- Billed To Section -->
          <div style="background: var(--slate-50); border: 1px solid var(--slate-200); border-radius: 8px; padding: 14px 18px; margin-bottom: 24px;">
            <div style="font-size: 0.6875rem; font-weight: 800; color: var(--slate-500); text-transform: uppercase;">BILL TO:</div>
            <div style="font-size: 1rem; font-weight: 800; color: var(--slate-900); margin-top: 2px;">{{ selectedInvoice.customerName }}</div>
            <div style="font-size: 0.8125rem; color: var(--slate-600); margin-top: 2px;">{{ selectedInvoice.customerAddress }}</div>
            <div style="font-size: 0.75rem; color: var(--slate-500);">Email: {{ selectedInvoice.customerEmail }}</div>
          </div>

          <!-- Total Balance Cards -->
          <div style="display: flex; justify-content: flex-end; margin-bottom: 24px;">
            <div style="width: 300px; display: flex; flex-direction: column; gap: 6px; font-size: 0.875rem;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--slate-600);">Taxable Subtotal:</span>
                <span class="text-mono">{{ authService.currencySymbol }}{{ selectedInvoice.subtotal | number:'1.2-2' }}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: var(--slate-600);">Tax:</span>
                <span class="text-mono">{{ authService.currencySymbol }}{{ selectedInvoice.tax | number:'1.2-2' }}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 1.1rem; border-top: 1px solid var(--slate-300); padding-top: 6px;">
                <span>Total Amount:</span>
                <span class="text-mono">{{ authService.currencySymbol }}{{ selectedInvoice.totalAmount | number:'1.2-2' }}</span>
              </div>
              <div style="display: flex; justify-content: space-between; color: var(--success); font-weight: 700;">
                <span>Paid to Date:</span>
                <span class="text-mono">{{ authService.currencySymbol }}{{ selectedInvoice.paidAmount | number:'1.2-2' }}</span>
              </div>
              <div style="display: flex; justify-content: space-between; color: var(--danger); font-weight: 800; font-size: 1.05rem; border-top: 1px dashed var(--slate-300); padding-top: 6px;">
                <span>Balance Due:</span>
                <span class="text-mono">{{ authService.currencySymbol }}{{ selectedInvoice.remainingAmount | number:'1.2-2' }}</span>
              </div>
            </div>
          </div>

          <!-- Settlement History -->
          <div *ngIf="selectedInvoice.payments && selectedInvoice.payments.length > 0" style="margin-top: 20px;">
            <div style="font-weight: 700; font-size: 0.875rem; margin-bottom: 8px;">Recorded Payment Receipts</div>
            <div class="table-container">
              <table class="oc-table">
                <thead>
                  <tr>
                    <th>Receipt #</th>
                    <th>Date</th>
                    <th>Method</th>
                    <th>Reference</th>
                    <th>Amount Paid</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let p of selectedInvoice.payments">
                    <td class="text-mono" style="font-weight: 600;">{{ p.paymentReference }}</td>
                    <td>{{ p.paymentDate | date:'mediumDate' }}</td>
                    <td><span class="badge badge-info">{{ p.paymentMethod }}</span></td>
                    <td class="text-mono">{{ p.transactionReference || 'N/A' }}</td>
                    <td class="text-mono" style="font-weight: 700; color: var(--success);">{{ authService.currencySymbol }}{{ p.amount | number:'1.2-2' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="no-print" style="margin-top: 30px; display: flex; justify-content: flex-end; gap: 10px;">
            <button class="btn btn-secondary" (click)="selectedInvoice = null">Close Preview</button>
            <button *ngIf="selectedInvoice.remainingAmount > 0 && authService.hasRole(['FINANCE_OFFICER', 'ADMIN'])" 
                    class="btn btn-success" 
                    (click)="openPaymentModal(selectedInvoice)">
              + Record Payment
            </button>
          </div>
        </div>
      </div>

      <!-- Record Payment Modal (Section 15) -->
      <div *ngIf="paymentModalInvoice" class="modal-overlay">
        <div class="modal-content" style="max-width: 520px;">
          <div class="modal-header">
            <h3 style="font-size: 1.15rem; font-weight: 700;">Record Payment for {{ paymentModalInvoice.invoiceNumber }}</h3>
            <button (click)="paymentModalInvoice = null" style="background: none; border: none; font-size: 1.25rem; cursor: pointer;">&times;</button>
          </div>
          <div class="modal-body">
            <div style="background: var(--slate-50); padding: 12px 16px; border-radius: 6px; margin-bottom: 16px; font-size: 0.875rem;">
              <div style="display: flex; justify-content: space-between;">
                <span>Total Invoice:</span>
                <strong class="text-mono">{{ authService.currencySymbol }}{{ paymentModalInvoice.totalAmount | number:'1.2-2' }}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 4px; color: var(--danger); font-weight: 700;">
                <span>Outstanding Balance:</span>
                <span class="text-mono">{{ authService.currencySymbol }}{{ paymentModalInvoice.remainingAmount | number:'1.2-2' }}</span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Payment Amount ({{ authService.currencySymbol }}) *</label>
              <input type="number" [(ngModel)]="paymentAmount" [max]="paymentModalInvoice.remainingAmount" min="1" class="form-control" />
              <div style="font-size: 0.75rem; color: var(--slate-500); margin-top: 4px;">
                Supports partial payments. Cannot exceed remaining {{ authService.currencySymbol }}{{ paymentModalInvoice.remainingAmount }}.
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Payment Method *</label>
              <select [(ngModel)]="paymentMethod" class="form-select">
                <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                <option value="UPI">UPI Payment</option>
                <option value="CARD">Credit / Corporate Card</option>
                <option value="CHEQUE">Cheque</option>
                <option value="CASH">Cash</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Bank Reference / UTR Number</label>
              <input type="text" [(ngModel)]="paymentTxRef" class="form-control" placeholder="e.g. UTR-HDFC-88220011" />
            </div>

            <div class="form-group">
              <label class="form-label">Notes</label>
              <textarea [(ngModel)]="paymentNotes" class="form-control" rows="2" placeholder="Settlement remarks"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="paymentModalInvoice = null">Cancel</button>
            <button class="btn btn-primary" [disabled]="!isPaymentValid()" (click)="submitPayment()">
              Confirm Payment
            </button>
          </div>
        </div>
      </div>

      <!-- Generate Invoice Modal -->
      <div *ngIf="showGenerateModal" class="modal-overlay">
        <div class="modal-content" style="max-width: 580px;">
          <div class="modal-header">
            <h3 style="font-size: 1.15rem; font-weight: 700;">Generate Invoice from Sales Order</h3>
            <button (click)="showGenerateModal = false" style="background: none; border: none; font-size: 1.25rem; cursor: pointer;">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">Select Sales Order *</label>
              <select [(ngModel)]="selectedSalesOrderIdForInvoice" class="form-select">
                <option [ngValue]="null">-- Choose Completed or Active Order --</option>
                <option *ngFor="let o of eligibleSalesOrders" [ngValue]="o.id">
                  {{ o.orderNumber }} - {{ o.customerName }} ({{ authService.currencySymbol }}{{ o.totalAmount | number:'1.0-0' }})
                </option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Payment Due Date</label>
              <input type="date" [(ngModel)]="invoiceDueDate" class="form-control" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showGenerateModal = false">Cancel</button>
            <button class="btn btn-primary" [disabled]="!selectedSalesOrderIdForInvoice" (click)="generateInvoice()">
              Issue Invoice
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
export class InvoicesComponent implements OnInit {
  invoices: Invoice[] = [];
  salesOrders: SalesOrder[] = [];
  searchQuery = '';
  statusFilter = 'ALL';

  selectedInvoice: Invoice | null = null;
  paymentModalInvoice: Invoice | null = null;
  showGenerateModal = false;

  selectedSalesOrderIdForInvoice: number | null = null;
  invoiceDueDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  paymentAmount = 0;
  paymentMethod: any = 'BANK_TRANSFER';
  paymentTxRef = '';
  paymentNotes = '';

  constructor(
    private dataService: OrdercraftDataService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.dataService.invoices$.subscribe(list => {
      this.invoices = list;
      if (this.selectedInvoice) {
        const found = list.find(i => i.id === this.selectedInvoice!.id);
        if (found) this.selectedInvoice = found;
      }
    });
    this.dataService.salesOrders$.subscribe(list => this.salesOrders = list);
  }

  get filteredInvoices(): Invoice[] {
    return this.invoices.filter(i => {
      const matchSearch = !this.searchQuery ||
        i.invoiceNumber.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        i.customerName.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchStatus = this.statusFilter === 'ALL' || i.status === this.statusFilter;
      return matchSearch && matchStatus;
    });
  }

  get eligibleSalesOrders(): SalesOrder[] {
    const invoicedSoIds = this.invoices.map(i => i.salesOrderId);
    return this.salesOrders.filter(o => !invoicedSoIds.includes(o.id) && o.status !== 'CANCELLED');
  }

  viewPrintableInvoice(inv: Invoice): void {
    this.selectedInvoice = inv;
  }

  printInvoice(): void {
    window.print();
  }

  openPaymentModal(inv: Invoice): void {
    this.paymentModalInvoice = inv;
    this.paymentAmount = inv.remainingAmount;
    this.paymentTxRef = 'RTGS-TR-' + Math.floor(Math.random() * 900000 + 100000);
    this.paymentNotes = 'Payment received for ' + inv.invoiceNumber;
  }

  isPaymentValid(): boolean {
    if (!this.paymentModalInvoice) return false;
    return this.paymentAmount > 0 && this.paymentAmount <= this.paymentModalInvoice.remainingAmount;
  }

  submitPayment(): void {
    if (!this.isPaymentValid()) return;
    this.dataService.recordPayment({
      invoiceId: this.paymentModalInvoice!.id,
      amount: this.paymentAmount,
      paymentMethod: this.paymentMethod,
      transactionReference: this.paymentTxRef,
      notes: this.paymentNotes
    });
    this.paymentModalInvoice = null;
  }

  openGenerateModal(): void {
    this.selectedSalesOrderIdForInvoice = this.eligibleSalesOrders[0]?.id || null;
    this.invoiceDueDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    this.showGenerateModal = true;
  }

  generateInvoice(): void {
    if (!this.selectedSalesOrderIdForInvoice) return;
    this.dataService.createInvoice(this.selectedSalesOrderIdForInvoice, this.invoiceDueDate);
    this.showGenerateModal = false;
  }
}
