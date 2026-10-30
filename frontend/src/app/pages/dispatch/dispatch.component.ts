import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrdercraftDataService } from '../../core/services/ordercraft-data.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { DeliveryNote, SalesOrder } from '../../core/models/models';

@Component({
  selector: 'app-dispatch',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header flex-between mb-4">
        <div>
          <h1 class="page-title">Dispatch & Delivery Notes (M8)</h1>
          <p class="text-secondary text-sm">Pick, pack, and ship finished goods against confirmed Sales Orders with automated stock deduction</p>
        </div>
        <button class="btn btn-primary flex-center gap-1" (click)="openDispatchModal()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="1" y="3" width="15" height="13"></rect>
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
            <circle cx="5.5" cy="18.5" r="2.5"></circle>
            <circle cx="18.5" cy="18.5" r="2.5"></circle>
          </svg>
          Create Delivery Note
        </button>
      </div>

      <!-- KPI Summary Cards -->
      <div class="grid grid-4 mb-4">
        <div class="card p-3">
          <span class="text-secondary text-xs font-semibold">TOTAL DELIVERIES</span>
          <h2 class="mt-1 font-bold">{{ deliveryNotes.length }}</h2>
        </div>
        <div class="card p-3">
          <span class="text-secondary text-xs font-semibold">IN TRANSIT (DISPATCHED)</span>
          <h2 class="mt-1 font-bold text-warning">{{ getCountByStatus('DISPATCHED') }}</h2>
        </div>
        <div class="card p-3">
          <span class="text-secondary text-xs font-semibold">DELIVERED TO CLIENT</span>
          <h2 class="mt-1 font-bold text-success">{{ getCountByStatus('DELIVERED') }}</h2>
        </div>
        <div class="card p-3">
          <span class="text-secondary text-xs font-semibold">READY TO DISPATCH</span>
          <h2 class="mt-1 font-bold text-primary">{{ readyOrders.length }} Order(s)</h2>
        </div>
      </div>

      <!-- Delivery Notes Table -->
      <div class="card p-0 mb-4">
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>DN Number</th>
                <th>Order Ref</th>
                <th>Customer</th>
                <th>Dispatch Date</th>
                <th>Transporter & Tracking</th>
                <th>Line Items</th>
                <th>Dispatched By</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let dn of deliveryNotes">
                <td class="font-bold text-primary">{{ dn.dnNumber }}</td>
                <td><code>{{ dn.salesOrderNumber }}</code></td>
                <td>{{ dn.customerName }}</td>
                <td>{{ dn.dispatchDate | date:'mediumDate' }}</td>
                <td>
                  <div class="font-semibold">{{ dn.transporterName }}</div>
                  <span class="text-secondary text-xs font-mono">Waybill: {{ dn.trackingNo }}</span>
                </td>
                <td>
                  <div *ngFor="let line of dn.lines" class="text-xs">
                    {{ line.qtyDispatched }}x {{ line.productName }}
                  </div>
                </td>
                <td>{{ dn.dispatchedBy }}</td>
                <td>
                  <span class="badge" [ngClass]="dn.status === 'DELIVERED' ? 'badge-success' : 'badge-warning'">
                    {{ dn.status }}
                  </span>
                </td>
              </tr>
              <tr *ngIf="deliveryNotes.length === 0">
                <td colspan="8" class="text-center py-4 text-secondary">
                  No delivery notes generated yet for this tenant. Click "Create Delivery Note" to dispatch orders.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Dispatch Modal -->
      <div *ngIf="showModal" class="modal-backdrop">
        <div class="modal card" style="max-width: 600px;">
          <div class="flex-between mb-3">
            <h3 class="font-bold text-lg">Generate Delivery Note (Dispatch)</h3>
            <button class="btn btn-sm btn-outline" (click)="showModal = false">✕</button>
          </div>
          <form (ngSubmit)="submitDispatch()">
            <div class="form-group mb-3">
              <label class="form-label font-semibold">Select Ready Sales Order *</label>
              <select class="form-control" [(ngModel)]="selectedOrderId" name="orderId" required>
                <option [ngValue]="null" disabled>Choose order ready for dispatch</option>
                <option *ngFor="let ord of eligibleOrders" [value]="ord.id">
                  {{ ord.orderNumber }} - {{ ord.customerName }} ({{ authService.currencySymbol }}{{ ord.totalAmount | number }})
                </option>
              </select>
            </div>
            <div class="grid grid-2 gap-3 mb-3">
              <div class="form-group">
                <label class="form-label font-semibold">Transporter / Carrier *</label>
                <input type="text" class="form-control" [(ngModel)]="transporterName" name="transporter" required placeholder="e.g. VRL Logistics, FedEx" />
              </div>
              <div class="form-group">
                <label class="form-label font-semibold">Tracking / Waybill # *</label>
                <input type="text" class="form-control" [(ngModel)]="trackingNo" name="tracking" required placeholder="e.g. TRK-882200" />
              </div>
            </div>
            <div class="alert alert-info p-2 mb-3 text-xs">
              ⚡ <strong>Automated Stock Ledger Movement:</strong> Submitting this delivery note will automatically generate a <code>DISPATCH</code> stock movement and lock items from re-dispatching.
            </div>
            <div class="flex-between mt-4">
              <button type="button" class="btn btn-outline" (click)="showModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="!selectedOrderId || !transporterName || !trackingNo">
                Confirm & Dispatch Goods
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; width: 100vw; height: 100vh;
      background: rgba(15, 23, 42, 0.6);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000;
    }
    .modal {
      width: 90%;
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }
  `]
})
export class DispatchComponent implements OnInit {
  deliveryNotes: DeliveryNote[] = [];
  salesOrders: SalesOrder[] = [];
  showModal = false;

  selectedOrderId: number | null = null;
  transporterName = '';
  trackingNo = '';

  constructor(
    public dataService: OrdercraftDataService,
    public authService: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.dataService.deliveryNotes$.subscribe(dns => this.deliveryNotes = dns);
    this.dataService.salesOrders$.subscribe(orders => this.salesOrders = orders);
  }

  getCountByStatus(status: string): number {
    return this.deliveryNotes.filter(d => d.status === status).length;
  }

  get readyOrders(): SalesOrder[] {
    return this.salesOrders.filter(o => o.status === 'READY_TO_SHIP' || o.status === 'IN_PROGRESS' || o.status === 'CONFIRMED');
  }

  get eligibleOrders(): SalesOrder[] {
    return this.salesOrders.filter(o => !o.associatedDeliveryNoteId && (o.status === 'READY_TO_SHIP' || o.status === 'IN_PROGRESS' || o.status === 'CONFIRMED'));
  }

  openDispatchModal(): void {
    this.selectedOrderId = this.eligibleOrders.length > 0 ? this.eligibleOrders[0].id : null;
    this.transporterName = 'Express Line Logistics';
    this.trackingNo = 'AWB-' + Math.floor(100000 + Math.random() * 900000);
    this.showModal = true;
  }

  submitDispatch(): void {
    if (!this.selectedOrderId) return;
    this.dataService.createDeliveryNote(this.selectedOrderId, this.transporterName, this.trackingNo);
    this.showModal = false;
  }
}
