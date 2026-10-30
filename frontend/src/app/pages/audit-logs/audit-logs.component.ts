import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrdercraftDataService } from '../../core/services/ordercraft-data.service';
import { AuditLogItem } from '../../core/models/models';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header flex-between mb-4">
        <div>
          <h1 class="page-title">Enterprise System Audit Trail</h1>
          <p class="text-secondary text-sm">Immutable chronological traceability of all ERP transactions, state transitions, and user actions</p>
        </div>
        <div class="flex-center gap-2">
          <span class="badge badge-success flex-center gap-1">
            <span class="pulse-dot"></span> Live Audit Active
          </span>
        </div>
      </div>

      <!-- Audit Metrics -->
      <div class="grid grid-4 mb-4">
        <div class="card p-3">
          <span class="text-secondary text-xs font-semibold">TOTAL AUDITED EVENTS</span>
          <h2 class="mt-1 font-bold">{{ auditLogs.length }}</h2>
        </div>
        <div class="card p-3">
          <span class="text-secondary text-xs font-semibold">SECURITY & AUTH EVENTS</span>
          <h2 class="mt-1 font-bold text-info">{{ getActionCount('USER_') }}</h2>
        </div>
        <div class="card p-3">
          <span class="text-secondary text-xs font-semibold">ORDER-TO-CASH EVENTS</span>
          <h2 class="mt-1 font-bold text-primary">{{ getActionCount('ORDER_') + getActionCount('INVOICE_') + getActionCount('PAYMENT_') }}</h2>
        </div>
        <div class="card p-3">
          <span class="text-secondary text-xs font-semibold">SHOP FLOOR MUTATIONS</span>
          <h2 class="mt-1 font-bold text-warning">{{ getActionCount('WORK_ORDER_') + getActionCount('MATERIAL_') + getActionCount('INVENTORY_') }}</h2>
        </div>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="card p-3 mb-4">
        <div class="flex-wrap gap-3 flex-between">
          <div class="flex-center gap-2" style="flex: 1; max-width: 400px;">
            <input
              type="text"
              class="form-control"
              placeholder="Filter by user, entity or ID..."
              [(ngModel)]="searchQuery"
            />
          </div>
          <div class="flex-center gap-2">
            <select class="form-control" [(ngModel)]="selectedActionFilter" style="width: 220px;">
              <option value="ALL">All Actions</option>
              <option value="ORDER_">Sales Order Events</option>
              <option value="WORK_ORDER_">Work Order Events</option>
              <option value="INVENTORY_">Inventory Events</option>
              <option value="MATERIAL_">Material Consumed</option>
              <option value="PURCHASE_ORDER_">Procurement PO Events</option>
              <option value="INVOICE_">Invoice Events</option>
              <option value="PAYMENT_">Payment Events</option>
              <option value="USER_">User Administration</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Audit Logs Table -->
      <div class="card p-0">
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th style="width: 80px;">Log ID</th>
                <th style="width: 170px;">Timestamp</th>
                <th>Operator / User</th>
                <th>Action Taken</th>
                <th>Entity Target</th>
                <th>State Change / Delta</th>
                <th style="width: 120px;">Client IP</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let log of filteredLogs">
                <td class="text-secondary font-mono">#{{ log.id }}</td>
                <td class="text-xs font-mono">{{ log.timestamp | date:'yyyy-MM-dd HH:mm:ss' }}</td>
                <td>
                  <div class="font-semibold text-sm">{{ log.username }}</div>
                </td>
                <td>
                  <span class="badge" [ngClass]="getActionBadgeClass(log.action)">
                    {{ log.action }}
                  </span>
                </td>
                <td>
                  <div class="flex-center gap-1" style="justify-content: flex-start;">
                    <span class="font-bold">{{ log.entityType }}:</span>
                    <code>{{ log.entityId }}</code>
                  </div>
                </td>
                <td>
                  <div class="text-xs">
                    <span *ngIf="log.oldValue" class="text-secondary strike mr-1">{{ log.oldValue }}</span>
                    <span *ngIf="log.oldValue" class="text-secondary">→</span>
                    <span class="font-semibold text-primary ml-1">{{ log.newValue }}</span>
                  </div>
                </td>
                <td class="font-mono text-xs text-secondary">{{ log.ipAddress }}</td>
              </tr>
              <tr *ngIf="filteredLogs.length === 0">
                <td colspan="7" class="text-center py-4 text-secondary">
                  No audit log entries found matching criteria.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .strike {
      text-decoration: line-through;
    }
    .pulse-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }
  `]
})
export class AuditLogsComponent implements OnInit {
  auditLogs: AuditLogItem[] = [];
  searchQuery: string = '';
  selectedActionFilter: string = 'ALL';

  constructor(private dataService: OrdercraftDataService) {}

  ngOnInit(): void {
    this.dataService.auditLogs$.subscribe(logs => this.auditLogs = logs);
  }

  getActionCount(prefix: string): number {
    return this.auditLogs.filter(l => l.action.startsWith(prefix)).length;
  }

  getActionBadgeClass(action: string): string {
    if (action.includes('CREATED') || action.includes('STARTED') || action.includes('APPROVED')) {
      return 'badge-info';
    }
    if (action.includes('CONFIRMED') || action.includes('COMPLETED') || action.includes('RECEIVED')) {
      return 'badge-success';
    }
    if (action.includes('CONSUMED') || action.includes('ADJUSTMENT') || action.includes('TOGGLED')) {
      return 'badge-warning';
    }
    if (action.includes('CANCELLED') || action.includes('REJECTED')) {
      return 'badge-danger';
    }
    return 'badge-primary';
  }

  get filteredLogs(): AuditLogItem[] {
    return this.auditLogs.filter(log => {
      const matchesSearch = !this.searchQuery ||
        log.username.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        log.entityId.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (log.newValue && log.newValue.toLowerCase().includes(this.searchQuery.toLowerCase()));

      const matchesAction = this.selectedActionFilter === 'ALL' ||
        log.action.startsWith(this.selectedActionFilter);

      return matchesSearch && matchesAction;
    });
  }
}
