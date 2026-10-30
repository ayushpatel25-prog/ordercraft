import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OrdercraftDataService } from '../../core/services/ordercraft-data.service';
import { AuthService } from '../../core/services/auth.service';
import { Bom, BomExplosionItem, Product } from '../../core/models/models';

@Component({
  selector: 'app-bom',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Bills of Materials (BOM) & MRP Engine</h1>
          <p class="page-subtitle">Configure engineering product recipes and compute batch material requirements</p>
        </div>
      </div>

      <div class="bom-layout">
        <!-- Left: BOM Selector List -->
        <div class="bom-list-col">
          <div class="oc-card" style="padding: 16px;">
            <div style="font-weight: 700; font-size: 0.9rem; margin-bottom: 12px;">Configured BOM Recipes</div>
            <div class="bom-items-nav">
              <div *ngFor="let b of boms" 
                   class="bom-nav-card" 
                   [class.active]="selectedBom?.id === b.id"
                   (click)="selectBom(b)">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span class="text-mono" style="font-size: 0.75rem; font-weight: 700; color: var(--primary);">{{ b.productSku }}</span>
                  <span class="badge badge-info">v{{ b.version }}</span>
                </div>
                <div style="font-weight: 700; font-size: 0.875rem; color: var(--slate-900); margin-top: 4px;">{{ b.productName }}</div>
                <div style="font-size: 0.75rem; color: var(--slate-500); margin-top: 2px;">{{ b.items.length }} component lines</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: BOM Details & Interactive MRP Calculator -->
        <div class="bom-detail-col" *ngIf="selectedBom">
          <div class="oc-card" style="margin-bottom: 20px;">
            <div class="oc-card-header">
              <div>
                <h3 style="font-size: 1.15rem; font-weight: 800;">{{ selectedBom.productName }}</h3>
                <div style="font-size: 0.8125rem; color: var(--slate-500);">SKU: {{ selectedBom.productSku }} • Version: {{ selectedBom.version }} • {{ selectedBom.description }}</div>
              </div>
              <span class="badge badge-success">{{ selectedBom.status }}</span>
            </div>
            <div class="oc-card-body">
              <div style="font-weight: 700; font-size: 0.875rem; margin-bottom: 10px;">Components Specification (Per 1 Finished Good)</div>
              <div class="table-container">
                <table class="oc-table">
                  <thead>
                    <tr>
                      <th>Material / Component</th>
                      <th>Material SKU</th>
                      <th>Quantity Required</th>
                      <th>Unit</th>
                      <th>Current Warehouse Available</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let item of selectedBom.items">
                      <td style="font-weight: 600;">{{ item.materialName }}</td>
                      <td class="text-mono">{{ item.materialSku }}</td>
                      <td style="font-weight: 700;">{{ item.quantityRequired }}</td>
                      <td>{{ item.unit }}</td>
                      <td class="text-mono">{{ item.availableStock }} {{ item.unit }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Real-world Engineering Cost Rollup & Gross Margin Analysis -->
          <div class="oc-card" style="margin-bottom: 20px;">
            <div class="oc-card-header">
              <span style="font-weight: 700; font-size: 0.95rem;">Engineering Cost Rollup & Margin Analysis</span>
              <span class="badge badge-info">Standard Costing Engine</span>
            </div>
            <div class="oc-card-body">
              <div class="grid grid-4 gap-3">
                <div class="card p-3" style="background: var(--slate-50);">
                  <span class="text-secondary text-xs font-semibold">ROLLED-UP MATERIAL COST</span>
                  <div class="text-mono font-bold text-lg mt-1" style="color: var(--slate-900);">
                    {{ authService.currencySymbol }}{{ getBomRolledUpCost() | number:'1.2-2' }}
                  </div>
                  <span class="text-secondary text-xs mt-1">Direct components sum</span>
                </div>

                <div class="card p-3" style="background: var(--slate-50);">
                  <span class="text-secondary text-xs font-semibold">FINISHED GOOD SELLING PRICE</span>
                  <div class="text-mono font-bold text-lg mt-1 text-primary">
                    {{ authService.currencySymbol }}{{ getSellingPrice() | number:'1.2-2' }}
                  </div>
                  <span class="text-secondary text-xs mt-1">Standard catalog base</span>
                </div>

                <div class="card p-3" style="background: var(--slate-50);">
                  <span class="text-secondary text-xs font-semibold">ESTIMATED GROSS MARGIN</span>
                  <div class="text-mono font-bold text-lg mt-1 text-success">
                    {{ authService.currencySymbol }}{{ getGrossMargin() | number:'1.2-2' }}
                  </div>
                  <span class="text-success text-xs font-semibold mt-1">{{ getGrossMarginPct() | number:'1.1-1' }}% Margin</span>
                </div>

                <div class="card p-3" style="background: var(--slate-50);">
                  <span class="text-secondary text-xs font-semibold">SCRAP & LOSS ALLOWANCE</span>
                  <div class="text-mono font-bold text-lg mt-1 text-warning">
                    5.0%
                  </div>
                  <span class="text-secondary text-xs mt-1">Tolerance buffer</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Interactive Material Requirement Simulator -->
          <div class="oc-card">
            <div class="oc-card-header" style="background: var(--slate-50);">
              <div>
                <span style="font-weight: 700; font-size: 0.95rem;">Interactive Batch Requirement Calculator</span>
                <div style="font-size: 0.75rem; color: var(--slate-500);">Simulate raw material consumption against warehouse inventory</div>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <label style="font-size: 0.8125rem; font-weight: 600;">Batch Quantity:</label>
                <input type="number" 
                       [(ngModel)]="simulatedBatchQty" 
                       (ngModelChange)="recalculateSimulation()"
                       min="1" 
                       class="form-control" 
                       style="width: 90px; padding: 4px 8px; font-weight: 700;" />
                <span style="font-size: 0.8125rem; font-weight: 600; color: var(--slate-600);">Units</span>
              </div>
            </div>
            <div class="oc-card-body">
              <div class="table-container">
                <table class="oc-table">
                  <thead>
                    <tr>
                      <th>Component</th>
                      <th>Per Unit</th>
                      <th>Batch Required</th>
                      <th>Available Stock</th>
                      <th>Shortage</th>
                      <th>Sufficiency</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let sim of simulatedRequirements">
                      <td style="font-weight: 600;">{{ sim.materialName }}</td>
                      <td>{{ sim.unitRequirement }} {{ sim.unit }}</td>
                      <td style="font-weight: 700;">{{ sim.totalRequired }} {{ sim.unit }}</td>
                      <td>{{ sim.availableStock }} {{ sim.unit }}</td>
                      <td [style.color]="sim.shortageQuantity > 0 ? 'var(--danger)' : 'var(--slate-700)'" style="font-weight: 700;">
                        {{ sim.shortageQuantity > 0 ? (sim.shortageQuantity + ' ' + sim.unit) : 'None' }}
                      </td>
                      <td>
                        <span class="badge" [ngClass]="sim.isSufficient ? 'badge-success' : 'badge-danger'">
                          {{ sim.isSufficient ? 'SUFFICIENT' : 'DEFICIT' }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Simulator Actions -->
              <div style="margin-top: 16px; display: flex; justify-content: flex-end; gap: 10px;">
                <button *ngIf="hasSimulatedDeficits()" 
                        class="btn btn-warning flex-center gap-1" 
                        (click)="autoCreatePoForSimulation()">
                  ⚡ Issue Purchase Order for {{ getDeficitCount() }} Deficit Component(s)
                </button>
                <button class="btn btn-primary flex-center gap-1" (click)="scheduleWorkOrderForSimulation()">
                  + Schedule Production Work Order ({{ simulatedBatchQty }} Units)
                </button>
              </div>
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

    .bom-layout {
      display: grid;
      grid-template-columns: 300px 1fr;
      gap: 20px;
    }

    @media (max-width: 900px) {
      .bom-layout {
        grid-template-columns: 1fr;
      }
    }

    .bom-items-nav {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .bom-nav-card {
      padding: 14px;
      border-radius: 8px;
      border: 1px solid var(--slate-200);
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .bom-nav-card:hover {
      background: var(--slate-50);
      border-color: var(--slate-300);
    }

    .bom-nav-card.active {
      border-color: var(--primary);
      background: var(--primary-light);
    }
  `]
})
export class BomComponent implements OnInit {
  boms: Bom[] = [];
  products: Product[] = [];
  selectedBom: Bom | null = null;
  simulatedBatchQty = 10;
  simulatedRequirements: BomExplosionItem[] = [];

  constructor(
    private dataService: OrdercraftDataService,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.dataService.products$.subscribe(list => this.products = list);
    this.dataService.boms$.subscribe(list => {
      this.boms = list;
      if (list.length > 0 && !this.selectedBom) {
        this.selectBom(list[0]);
      }
    });
  }

  selectBom(bom: Bom): void {
    this.selectedBom = bom;
    this.recalculateSimulation();
  }

  recalculateSimulation(): void {
    if (!this.selectedBom) return;
    this.simulatedRequirements = this.dataService.calculateBomRequirements(
      this.selectedBom.productId,
      this.simulatedBatchQty || 1
    );
  }

  getBomRolledUpCost(): number {
    if (!this.selectedBom) return 0;
    return this.selectedBom.items.reduce((sum, it) => {
      const prod = this.products.find(p => p.id === it.materialId);
      const cost = prod?.unitPrice || 450;
      return sum + (it.quantityRequired * cost);
    }, 0);
  }

  getSellingPrice(): number {
    if (!this.selectedBom) return 0;
    const fg = this.products.find(p => p.id === this.selectedBom?.productId);
    return fg?.unitPrice || 45000;
  }

  getGrossMargin(): number {
    return Math.max(0, this.getSellingPrice() - this.getBomRolledUpCost());
  }

  getGrossMarginPct(): number {
    const sp = this.getSellingPrice();
    if (sp === 0) return 0;
    return (this.getGrossMargin() / sp) * 100;
  }

  hasSimulatedDeficits(): boolean {
    return this.simulatedRequirements.some(s => s.shortageQuantity > 0);
  }

  getDeficitCount(): number {
    return this.simulatedRequirements.filter(s => s.shortageQuantity > 0).length;
  }

  autoCreatePoForSimulation(): void {
    if (!this.hasSimulatedDeficits()) return;
    try {
      this.dataService.createPoFromShortages(this.simulatedRequirements);
      this.router.navigate(['/purchase-orders']);
    } catch (e) {
      console.error(e);
    }
  }

  scheduleWorkOrderForSimulation(): void {
    if (!this.selectedBom) return;
    try {
      this.dataService.createWorkOrder({
        productId: this.selectedBom.productId,
        quantity: this.simulatedBatchQty || 1,
        assignedTo: 'Vikram Rao (Assembly Team Alpha)',
        expectedEndDate: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10),
        notes: `Simulated production batch generated from BOM recipe v${this.selectedBom.version}`
      });
      this.router.navigate(['/work-orders']);
    } catch (e) {
      console.error(e);
    }
  }
}
