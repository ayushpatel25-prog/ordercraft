import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrdercraftDataService } from '../../core/services/ordercraft-data.service';
import { AuthService } from '../../core/services/auth.service';
import { ThreeWayMatchRecord } from '../../core/models/models';

@Component({
  selector: 'app-three-way-match',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <div class="page-header flex-between mb-4">
        <div>
          <h1 class="page-title">3-Way Procurement Reconciliation (M6)</h1>
          <p class="text-secondary text-sm">Automated tolerance verification across Purchase Orders, Goods Receipt Notes (GRN), and Vendor Invoices</p>
        </div>
        <div class="flex-center gap-2">
          <span class="badge badge-info">Tolerance Limit: ±1% Price, 0% Qty</span>
        </div>
      </div>

      <!-- Overview Cards -->
      <div class="grid grid-3 mb-4">
        <div class="card p-3">
          <span class="text-secondary text-xs font-semibold">TOTAL RECONCILED ORDERS</span>
          <h2 class="mt-1 font-bold">{{ matchRecords.length }}</h2>
        </div>
        <div class="card p-3">
          <span class="text-secondary text-xs font-semibold">CLEAN MATCH (APPROVED FOR PAYMENT)</span>
          <h2 class="mt-1 font-bold text-success">{{ getCount('MATCHED') }}</h2>
        </div>
        <div class="card p-3">
          <span class="text-secondary text-xs font-semibold">TOLERANCE / VARIANCE ALERTS</span>
          <h2 class="mt-1 font-bold text-danger">{{ getCount('DISCREPANCY') }}</h2>
        </div>
      </div>

      <!-- 3-Way Matching Ledger Table -->
      <div class="card p-0 mb-4">
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Supplier</th>
                <th>Agreed PO Total</th>
                <th>Warehouse GRN #</th>
                <th>Accepted GRN Value</th>
                <th>Vendor Invoice</th>
                <th>Invoice Billed</th>
                <th>Variance</th>
                <th>Reconciliation Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let rec of matchRecords">
                <td class="font-bold"><code>{{ rec.poNumber }}</code></td>
                <td>{{ rec.supplierName }}</td>
                <td class="font-semibold">{{ authService.currencySymbol }}{{ rec.poTotal | number:'1.2-2' }}</td>
                <td>
                  <span *ngIf="rec.grnNumber !== 'Pending GRN'" class="badge badge-info">{{ rec.grnNumber }}</span>
                  <span *ngIf="rec.grnNumber === 'Pending GRN'" class="text-secondary text-xs font-italic">Awaiting Shipment</span>
                </td>
                <td class="font-semibold">
                  <span *ngIf="rec.grnAcceptedValue > 0">{{ authService.currencySymbol }}{{ rec.grnAcceptedValue | number:'1.2-2' }}</span>
                  <span *ngIf="rec.grnAcceptedValue === 0" class="text-secondary">-</span>
                </td>
                <td>{{ rec.invoiceNumber }}</td>
                <td class="font-bold">
                  <span *ngIf="rec.invoiceTotal > 0">{{ authService.currencySymbol }}{{ rec.invoiceTotal | number:'1.2-2' }}</span>
                  <span *ngIf="rec.invoiceTotal === 0" class="text-secondary">-</span>
                </td>
                <td [class.text-danger]="rec.varianceAmount > 0" class="font-bold">
                  {{ authService.currencySymbol }}{{ rec.varianceAmount | number:'1.2-2' }}
                </td>
                <td>
                  <span class="badge" [ngClass]="{
                    'badge-success': rec.status === 'MATCHED',
                    'badge-danger': rec.status === 'DISCREPANCY',
                    'badge-warning': rec.status === 'PENDING_GRN'
                  }">
                    {{ rec.status === 'MATCHED' ? '✔ 3-WAY MATCHED' : rec.status === 'DISCREPANCY' ? '⚠ VARIANCE DETECTED' : '⏳ AWAITING GRN' }}
                  </span>
                </td>
              </tr>
              <tr *ngIf="matchRecords.length === 0">
                <td colspan="9" class="text-center py-4 text-secondary">
                  No purchase orders found for 3-way matching in this tenant.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Architectural Note -->
      <div class="card p-3">
        <h4 class="font-bold text-sm mb-1">Financial Control Rule:</h4>
        <p class="text-secondary text-xs">
          The Procure-to-Pay engine blocks supplier payment release unless: (1) Goods Receipt Note (GRN) confirms items are accepted by quality control (QC); (2) Billed invoice unit rates equal purchase order agreed rates within the statutory ±1% threshold; and (3) Quantity billed ≤ Quantity received.
        </p>
      </div>
    </div>
  `
})
export class ThreeWayMatchComponent implements OnInit {
  matchRecords: ThreeWayMatchRecord[] = [];

  constructor(
    public dataService: OrdercraftDataService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.refreshRecords();
    this.dataService.purchaseOrders$.subscribe(() => this.refreshRecords());
    this.dataService.goodsReceipts$.subscribe(() => this.refreshRecords());
  }

  refreshRecords(): void {
    this.matchRecords = this.dataService.getThreeWayMatchRecords();
  }

  getCount(status: string): number {
    return this.matchRecords.filter(r => r.status === status).length;
  }
}
