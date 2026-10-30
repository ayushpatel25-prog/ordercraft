import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrdercraftDataService } from '../../core/services/ordercraft-data.service';
import { AuthService } from '../../core/services/auth.service';
import { Payment } from '../../core/models/models';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Payments Ledger & Receipts</h1>
          <p class="page-subtitle">Complete reconciliation log of cash, wire transfer, and UPI customer settlements</p>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="toolbar oc-card">
        <div style="flex: 1; min-width: 260px;">
          <input type="text" [(ngModel)]="searchQuery" placeholder="Search by Receipt #, Invoice # or Bank Ref..." class="form-control" />
        </div>
        <select [(ngModel)]="methodFilter" class="form-select" style="width: 180px;">
          <option value="ALL">All Payment Methods</option>
          <option value="BANK_TRANSFER">Bank Transfer</option>
          <option value="UPI">UPI</option>
          <option value="CARD">Card</option>
          <option value="CHEQUE">Cheque</option>
          <option value="CASH">Cash</option>
        </select>
      </div>

      <!-- Payments Table -->
      <div class="table-container oc-card">
        <table class="oc-table">
          <thead>
            <tr>
              <th>Receipt #</th>
              <th>Invoice #</th>
              <th>Payment Date</th>
              <th>Method</th>
              <th>Transaction / UTR</th>
              <th>Amount Settled</th>
              <th>Status</th>
              <th>Cashier / Officer</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of filteredPayments">
              <td class="text-mono" style="font-weight: 700; color: var(--primary);">{{ p.paymentReference }}</td>
              <td class="text-mono" style="font-weight: 600;">{{ p.invoiceNumber }}</td>
              <td>{{ p.paymentDate | date:'medium' }}</td>
              <td><span class="badge badge-info">{{ p.paymentMethod }}</span></td>
              <td class="text-mono">{{ p.transactionReference || 'N/A' }}</td>
              <td class="text-mono" style="font-weight: 800; color: var(--success); font-size: 0.95rem;">
                {{ authService.currencySymbol }}{{ p.amount | number:'1.2-2' }}
              </td>
              <td><span class="badge badge-success">{{ p.status }}</span></td>
              <td>{{ p.recordedBy }}</td>
              <td style="font-size: 0.75rem; color: var(--slate-500);">{{ p.notes }}</td>
            </tr>
            <tr *ngIf="filteredPayments.length === 0">
              <td colspan="9" style="text-align: center; padding: 40px; color: var(--slate-400);">No payments matching search</td>
            </tr>
          </tbody>
        </table>
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
export class PaymentsComponent implements OnInit {
  payments: Payment[] = [];
  searchQuery = '';
  methodFilter = 'ALL';

  constructor(
    private dataService: OrdercraftDataService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.dataService.payments$.subscribe(list => this.payments = list);
  }

  get filteredPayments(): Payment[] {
    return this.payments.filter(p => {
      const matchSearch = !this.searchQuery ||
        p.paymentReference.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
        (p.transactionReference && p.transactionReference.toLowerCase().includes(this.searchQuery.toLowerCase()));
      const matchMethod = this.methodFilter === 'ALL' || p.paymentMethod === this.methodFilter;
      return matchSearch && matchMethod;
    });
  }
}
