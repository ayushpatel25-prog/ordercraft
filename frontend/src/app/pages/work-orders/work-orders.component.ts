import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrdercraftDataService } from '../../core/services/ordercraft-data.service';
import { AuthService } from '../../core/services/auth.service';
import { WorkOrder } from '../../core/models/models';

@Component({
  selector: 'app-work-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Shop-Floor Work Orders & Production</h1>
          <p class="page-subtitle">Track manufacturing execution, material consumption, and finished goods assembly</p>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="toolbar oc-card">
        <div style="flex: 1; min-width: 260px;">
          <input type="text" [(ngModel)]="searchQuery" placeholder="Search by WO #, Product, or Assembly Supervisor..." class="form-control" />
        </div>
        <select [(ngModel)]="statusFilter" class="form-select" style="width: 170px;">
          <option value="ALL">All Statuses</option>
          <option value="PLANNED">PLANNED</option>
          <option value="IN_PROGRESS">IN PROGRESS</option>
          <option value="ON_HOLD">ON HOLD</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </div>

      <!-- Work Orders Table -->
      <div class="table-container oc-card">
        <table class="oc-table">
          <thead>
            <tr>
              <th>Work Order #</th>
              <th>Finished Product</th>
              <th>Linked SO</th>
              <th>Batch Qty</th>
              <th>Assigned To</th>
              <th>Progress</th>
              <th>Status</th>
              <th>Target Date</th>
              <th style="text-align: right;">Operations</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let wo of filteredWorkOrders">
              <td class="text-mono" style="font-weight: 700; color: var(--primary);">{{ wo.workOrderNumber }}</td>
              <td>
                <div style="font-weight: 600; color: var(--slate-900);">{{ wo.productName }}</div>
                <div class="text-mono" style="font-size: 0.75rem; color: var(--slate-500);">{{ wo.productSku }}</div>
              </td>
              <td>
                <span *ngIf="wo.salesOrderNumber" class="text-mono" style="font-weight: 600; color: var(--slate-700);">
                  {{ wo.salesOrderNumber }}
                </span>
                <span *ngIf="!wo.salesOrderNumber" style="color: var(--slate-400);">Make to Stock</span>
              </td>
              <td style="font-weight: 700;">{{ wo.quantity }} Units</td>
              <td>{{ wo.assignedTo }}</td>
              <td style="width: 180px;">
                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: 600; margin-bottom: 3px;">
                  <span>{{ wo.progressPercentage }}%</span>
                </div>
                <div class="progress-track">
                  <div class="progress-bar" 
                       [style.width.%]="wo.progressPercentage"
                       [style.background]="getProgressColor(wo.progressPercentage)"></div>
                </div>
              </td>
              <td>
                <span class="badge" [ngClass]="'badge-' + wo.status.toLowerCase()">
                  {{ wo.status }}
                </span>
              </td>
              <td>{{ wo.expectedEndDate | date:'mediumDate' }}</td>
              <td style="text-align: right;">
                <button class="btn btn-sm btn-secondary" (click)="inspectWorkOrder(wo)">
                  Inspect
                </button>
              </td>
            </tr>
            <tr *ngIf="filteredWorkOrders.length === 0">
              <td colspan="9" style="text-align: center; padding: 40px; color: var(--slate-400);">
                No work orders found matching search criteria
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Work Order Execution Drawer / Modal (Section 36) -->
      <div *ngIf="selectedWo" class="modal-overlay">
        <div class="modal-content" style="max-width: 820px;">
          <div class="modal-header">
            <div>
              <h3 style="font-size: 1.2rem; font-weight: 800; display: inline-flex; align-items: center; gap: 10px;">
                {{ selectedWo.workOrderNumber }}
                <span class="badge" [ngClass]="'badge-' + selectedWo.status.toLowerCase()">{{ selectedWo.status }}</span>
              </h3>
              <div style="font-size: 0.8125rem; color: var(--slate-500); margin-top: 2px;">
                Assembly Item: {{ selectedWo.productName }} • Quantity: {{ selectedWo.quantity }} Units
              </div>
            </div>
            <button (click)="selectedWo = null" style="background: none; border: none; font-size: 1.25rem; cursor: pointer;">&times;</button>
          </div>
          <div class="modal-body">
            <!-- Progress Controls -->
            <div class="oc-card" style="padding: 16px; margin-bottom: 20px; background: var(--slate-50);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-weight: 700; font-size: 0.875rem;">Assembly Line Completion</span>
                <span style="font-weight: 800; font-size: 1.1rem; color: var(--primary);">{{ selectedWo.progressPercentage }}%</span>
              </div>
              <div class="progress-track" style="height: 10px; margin-bottom: 12px;">
                <div class="progress-bar" 
                     [style.width.%]="selectedWo.progressPercentage"
                     [style.background]="getProgressColor(selectedWo.progressPercentage)"></div>
              </div>
              <div *ngIf="selectedWo.status === 'IN_PROGRESS' && authService.hasRole(['PRODUCTION_MANAGER', 'ADMIN'])" 
                   style="display: flex; gap: 8px; align-items: center;">
                <button class="btn btn-sm btn-secondary" (click)="updateProgress(selectedWo.progressPercentage + 20)">+20% Progress</button>
                <button class="btn btn-sm btn-secondary" (click)="updateProgress(selectedWo.progressPercentage + 50)">+50% Progress</button>
                <button class="btn btn-sm btn-success" (click)="updateProgress(100)">Complete 100%</button>
              </div>
            </div>

            <!-- Required Materials Table per BOM -->
            <div style="font-weight: 700; font-size: 0.9rem; margin-bottom: 8px;">Required Raw Materials & Components</div>
            <div class="table-container" style="margin-bottom: 20px;">
              <table class="oc-table">
                <thead>
                  <tr>
                    <th>Component Name</th>
                    <th>SKU</th>
                    <th>Required Qty</th>
                    <th>Stock Available</th>
                    <th>Shortage</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let m of selectedWo.requiredMaterials">
                    <td style="font-weight: 600;">{{ m.materialName }}</td>
                    <td class="text-mono">{{ m.materialSku }}</td>
                    <td style="font-weight: 700;">{{ m.totalRequired }} {{ m.unit }}</td>
                    <td>{{ m.availableStock }} {{ m.unit }}</td>
                    <td [style.color]="m.shortageQuantity > 0 ? 'var(--danger)' : 'var(--slate-600)'" style="font-weight: 600;">
                      {{ m.shortageQuantity > 0 ? (m.shortageQuantity + ' ' + m.unit) : '0' }}
                    </td>
                    <td>
                      <span class="badge" [ngClass]="m.isSufficient ? 'badge-success' : 'badge-danger'">
                        {{ m.isSufficient ? 'AVAILABLE' : 'SHORTAGE' }}
                      </span>
                    </td>
                  </tr>
                  <tr *ngIf="!selectedWo.requiredMaterials || selectedWo.requiredMaterials.length === 0">
                    <td colspan="6" style="text-align: center; color: var(--slate-400); padding: 20px;">
                      No components linked or standard assembly
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Shop-floor notes -->
            <div class="form-group">
              <label class="form-label">Shop Floor Operational Notes</label>
              <div style="font-size: 0.8125rem; color: var(--slate-700); padding: 8px 12px; background: var(--slate-50); border-radius: 6px; border: 1px solid var(--slate-200);">
                {{ selectedWo.notes || 'Normal assembly schedule assigned to line supervisor.' }}
              </div>
            </div>

            <!-- Quality & Scrap Yield Control Widget -->
            <div class="oc-card" style="padding: 16px; margin-top: 16px; background: #fafbfc;">
              <div style="font-weight: 700; font-size: 0.875rem; color: var(--slate-900); margin-bottom: 8px;">
                Quality Inspection & Scrap Yield Tracking
              </div>
              <div class="grid grid-3 gap-3">
                <div class="form-group mb-0">
                  <label class="form-label">Scrap Units Recorded</label>
                  <input type="number" [(ngModel)]="scrapQuantity" min="0" [max]="selectedWo.quantity" class="form-control" />
                </div>
                <div class="form-group mb-0">
                  <label class="form-label">Defect Reason</label>
                  <select [(ngModel)]="scrapReason" class="form-select">
                    <option value="DIMENSIONAL_DEFECT">Dimensional Tolerance Defect</option>
                    <option value="MACHINING_BURR">Machining Surface Burr</option>
                    <option value="MATERIAL_DEFECT">Raw Material Ingot Porosity</option>
                    <option value="ASSEMBLY_DAMAGE">Assembly Press Damage</option>
                  </select>
                </div>
                <div class="form-group mb-0 flex flex-col justify-center">
                  <label class="form-label">Shop Floor Yield</label>
                  <div class="text-mono font-bold text-lg" [style.color]="getYieldPct() >= 95 ? 'var(--success)' : 'var(--warning)'">
                    {{ getYieldPct() | number:'1.1-1' }}% Yield
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline-primary" (click)="showTravelerModal = true">🖨 Print Job Traveler</button>
            <button class="btn btn-secondary" (click)="selectedWo = null">Close</button>

            <!-- Production Action Triggers -->
            <ng-container *ngIf="authService.hasRole(['PRODUCTION_MANAGER', 'ADMIN'])">
              <button *ngIf="selectedWo.status === 'PLANNED'" 
                      class="btn btn-primary" 
                      (click)="startWo(selectedWo.id)">
                ▶ Start Work Order
              </button>

              <button *ngIf="selectedWo.status === 'IN_PROGRESS'" 
                      class="btn btn-secondary" 
                      (click)="pauseWo(selectedWo.id)">
                ⏸ Pause (Hold)
              </button>

              <button *ngIf="selectedWo.status === 'ON_HOLD'" 
                      class="btn btn-primary" 
                      (click)="resumeWo(selectedWo.id)">
                ▶ Resume Production
              </button>

              <button *ngIf="selectedWo.status === 'IN_PROGRESS'" 
                      class="btn btn-secondary" 
                      (click)="consumeMaterials(selectedWo.id)">
                Consume Warehouse Materials
              </button>

              <button *ngIf="selectedWo.status !== 'COMPLETED' && selectedWo.status !== 'CANCELLED'" 
                      class="btn btn-success" 
                      (click)="completeWo(selectedWo.id)">
                ✓ Mark As Completed
              </button>
            </ng-container>
          </div>
        </div>
      </div>

      <!-- Printable Job Traveler Modal -->
      <div *ngIf="showTravelerModal && selectedWo" class="modal-overlay">
        <div class="modal-content invoice-printable" style="max-width: 800px; padding: 28px;">
          <div class="no-print" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--slate-200); padding-bottom: 10px;">
            <span style="font-weight: 700; font-size: 0.85rem; color: var(--slate-500);">SHOP FLOOR JOB TRAVELER SHEET</span>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-sm btn-primary" (click)="printTraveler()">🖨 Print Traveler</button>
              <button class="btn btn-sm btn-secondary" (click)="showTravelerModal = false">Close</button>
            </div>
          </div>

          <!-- Printable Sheet Content -->
          <div style="border: 2px solid var(--slate-900); padding: 24px; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid var(--slate-900); padding-bottom: 14px; margin-bottom: 16px;">
              <div>
                <h2 style="font-size: 1.4rem; font-weight: 800; color: var(--slate-950);">ORDERCRAFT MANUFACTURING</h2>
                <div style="font-size: 0.8rem; font-weight: 700; color: var(--slate-600); margin-top: 2px;">
                  PLANT ROUTING TRAVELER &bull; {{ authService.currentTenantValue?.plantLocation }}
                </div>
              </div>
              <div style="text-align: right;">
                <div class="text-mono" style="font-size: 1.3rem; font-weight: 800; color: var(--primary);">{{ selectedWo.workOrderNumber }}</div>
                <div style="font-size: 0.75rem; color: var(--slate-500); font-family: monospace;">||||| | |||| |||||| || |</div>
              </div>
            </div>

            <!-- Header Info Grid -->
            <div class="grid grid-4 gap-3 mb-4" style="background: var(--slate-50); padding: 12px; border-radius: 6px; border: 1px solid var(--slate-200);">
              <div>
                <span class="text-xs font-semibold text-secondary">PRODUCT</span>
                <div class="font-bold text-sm">{{ selectedWo.productName }}</div>
              </div>
              <div>
                <span class="text-xs font-semibold text-secondary">SKU</span>
                <div class="text-mono font-bold text-sm">{{ selectedWo.productSku }}</div>
              </div>
              <div>
                <span class="text-xs font-semibold text-secondary">BATCH QTY</span>
                <div class="font-bold text-sm">{{ selectedWo.quantity }} Units</div>
              </div>
              <div>
                <span class="text-xs font-semibold text-secondary">SALES ORDER REF</span>
                <div class="text-mono font-bold text-sm">{{ selectedWo.salesOrderNumber || 'MAKE-TO-STOCK' }}</div>
              </div>
            </div>

            <!-- Routing Stages Checklist Table -->
            <div style="font-weight: 700; font-size: 0.88rem; margin-bottom: 8px;">Manufacturing Routing Stages</div>
            <div class="table-container mb-4">
              <table class="oc-table">
                <thead>
                  <tr>
                    <th>Seq</th>
                    <th>Work Center / Operation</th>
                    <th>Standard Machine</th>
                    <th>Sign-Off</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="font-bold">10</td>
                    <td>Raw Material Issue & Kitting</td>
                    <td>WH-C Kitting Bay</td>
                    <td>[ &check; ] Stores Sign</td>
                    <td><span class="badge badge-success">COMPLETED</span></td>
                  </tr>
                  <tr>
                    <td class="font-bold">20</td>
                    <td>CNC Precision Machining & Turning</td>
                    <td>CNC-HAAS-500</td>
                    <td>[ &check; ] Operator</td>
                    <td><span class="badge badge-info">IN-PROGRESS</span></td>
                  </tr>
                  <tr>
                    <td class="font-bold">30</td>
                    <td>Sub-Assembly & Torque Calibration</td>
                    <td>Line Alpha Bench 3</td>
                    <td>[ &nbsp;&nbsp;&nbsp; ] Tech Sign</td>
                    <td><span class="badge badge-neutral">PENDING</span></td>
                  </tr>
                  <tr>
                    <td class="font-bold">40</td>
                    <td>Hydrostatic QA Pressure Test</td>
                    <td>QA Test Rig 2</td>
                    <td>[ &nbsp;&nbsp;&nbsp; ] QA Inspector</td>
                    <td><span class="badge badge-neutral">PENDING</span></td>
                  </tr>
                  <tr>
                    <td class="font-bold">50</td>
                    <td>Finished Packaging & Barcoding</td>
                    <td>Pallet Pack Line</td>
                    <td>[ &nbsp;&nbsp;&nbsp; ] Supervisor</td>
                    <td><span class="badge badge-neutral">PENDING</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Signatures block -->
            <div style="display: flex; justify-content: space-between; margin-top: 24px; padding-top: 14px; border-top: 1px dashed var(--slate-300); font-size: 0.78rem;">
              <div>Assembly Lead: _______________________</div>
              <div>QA Inspector: _______________________</div>
              <div>Plant Manager: _______________________</div>
            </div>
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

    .progress-track {
      width: 100%;
      height: 6px;
      background: var(--slate-100);
      border-radius: 999px;
      overflow: hidden;
    }

    .progress-bar {
      height: 100%;
      border-radius: 999px;
      transition: width 0.3s ease;
    }
  `]
})
export class WorkOrdersComponent implements OnInit {
  workOrders: WorkOrder[] = [];
  searchQuery = '';
  statusFilter = 'ALL';
  selectedWo: WorkOrder | null = null;
  scrapQuantity = 0;
  scrapReason = 'DIMENSIONAL_DEFECT';
  showTravelerModal = false;

  constructor(
    private dataService: OrdercraftDataService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.dataService.workOrders$.subscribe(list => {
      this.workOrders = list;
      if (this.selectedWo) {
        const found = list.find(w => w.id === this.selectedWo!.id);
        if (found) this.selectedWo = found;
      }
    });
  }

  get filteredWorkOrders(): WorkOrder[] {
    return this.workOrders.filter(w => {
      const matchSearch = !this.searchQuery ||
        w.workOrderNumber.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        w.productName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        w.assignedTo.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchStatus = this.statusFilter === 'ALL' || w.status === this.statusFilter;
      return matchSearch && matchStatus;
    });
  }

  getProgressColor(percentage: number): string {
    if (percentage >= 100) return 'var(--success)';
    if (percentage >= 50) return 'var(--info)';
    return 'var(--primary)';
  }

  inspectWorkOrder(wo: WorkOrder): void {
    this.selectedWo = wo;
  }

  startWo(woId: number): void {
    this.dataService.startWorkOrder(woId);
  }

  pauseWo(woId: number): void {
    this.dataService.pauseWorkOrder(woId);
  }

  resumeWo(woId: number): void {
    this.dataService.resumeWorkOrder(woId);
  }

  updateProgress(percentage: number): void {
    if (!this.selectedWo) return;
    this.dataService.updateWorkOrderProgress(this.selectedWo.id, percentage);
  }

  consumeMaterials(woId: number): void {
    this.dataService.consumeWorkOrderMaterials(woId);
  }

  completeWo(woId: number): void {
    this.dataService.completeWorkOrder(woId);
  }

  getYieldPct(): number {
    if (!this.selectedWo || this.selectedWo.quantity === 0) return 100;
    const goodUnits = Math.max(0, this.selectedWo.quantity - (this.scrapQuantity || 0));
    return (goodUnits / this.selectedWo.quantity) * 100;
  }

  printTraveler(): void {
    window.print();
  }
}
