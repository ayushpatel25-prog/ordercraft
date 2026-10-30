import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Tenant } from '../../core/models/models';

@Component({
  selector: 'app-tenant-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header flex-between mb-4">
        <div>
          <h1 class="page-title">Tenant Organization & Governance Settings (M1)</h1>
          <p class="text-secondary text-sm">Tenant profile, approval limits, fiscal tax regimes, gap-free numbering, and enterprise security policies</p>
        </div>
        <button class="btn btn-primary" (click)="saveSettings()">Save Configuration</button>
      </div>

      <div class="grid grid-2 gap-4">
        <!-- Tenant Identity & Plant Profile -->
        <div class="card p-4">
          <h3 class="font-bold text-base mb-3">Enterprise Tenant Profile</h3>
          
          <div class="form-group mb-3">
            <label class="form-label font-semibold">Tenant Legal Entity Name</label>
            <input type="text" class="form-control" [(ngModel)]="tenant.name" />
          </div>

          <div class="grid grid-2 gap-3 mb-3">
            <div class="form-group">
              <label class="form-label font-semibold">Tenant Code (Unique)</label>
              <input type="text" class="form-control font-mono" [value]="tenant.code" disabled />
            </div>
            <div class="form-group">
              <label class="form-label font-semibold">SaaS Subscription Plan</label>
              <input type="text" class="form-control" [value]="tenant.plan" disabled />
            </div>
          </div>

          <div class="grid grid-2 gap-3 mb-3">
            <div class="form-group">
              <label class="form-label font-semibold">Base Currency</label>
              <input type="text" class="form-control font-bold" [value]="tenant.currency + ' (' + tenant.currencySymbol + ')'" disabled />
            </div>
            <div class="form-group">
              <label class="form-label font-semibold">Server & Audit Timezone</label>
              <input type="text" class="form-control font-mono" [value]="tenant.timezone" disabled />
            </div>
          </div>

          <div class="form-group mb-3">
            <label class="form-label font-semibold">Primary Manufacturing Plant Location</label>
            <input type="text" class="form-control" [(ngModel)]="tenant.plantLocation" />
          </div>

          <div class="form-group">
            <label class="form-label font-semibold">Public UUID (API Discriminator)</label>
            <input type="text" class="form-control font-mono text-xs" [value]="tenant.publicId" disabled />
          </div>
        </div>

        <!-- Approval Rules & Financial Governance -->
        <div class="card p-4">
          <h3 class="font-bold text-base mb-3">Workflow Approval Rules & Tax Regime</h3>

          <div class="form-group mb-3">
            <label class="form-label font-semibold">Order Approval Value Threshold ({{ tenant.currencySymbol }}) *</label>
            <input type="number" class="form-control font-mono font-bold" [(ngModel)]="tenant.settings.approvalThreshold" />
            <small class="text-secondary text-xs">Sales orders exceeding this value automatically require Sales Manager sign-off.</small>
          </div>

          <div class="form-group mb-3">
            <label class="form-label font-semibold">Max Sales Discount Limit (%) *</label>
            <input type="number" class="form-control font-mono font-bold" [(ngModel)]="tenant.settings.maxDiscountPct" />
            <small class="text-secondary text-xs">Line-item discounts above this percentage trigger managerial approval.</small>
          </div>

          <div class="grid grid-2 gap-3 mb-3">
            <div class="form-group">
              <label class="form-label font-semibold">Active Tax Regime</label>
              <input type="text" class="form-control font-bold" [(ngModel)]="tenant.settings.taxRegime" />
            </div>
            <div class="form-group">
              <label class="form-label font-semibold">Current Fiscal Year</label>
              <input type="text" class="form-control font-mono" [(ngModel)]="tenant.settings.fiscalYear" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label font-semibold">Failed Login Lockout Policy</label>
            <div class="p-2 border rounded bg-light text-xs">
              🔒 <strong>Strict Enterprise Lockout:</strong> Account locks for 15 minutes after <code>{{ tenant.settings.lockoutThreshold }} consecutive failed attempts</code>.
            </div>
          </div>
        </div>
      </div>

      <!-- Gap-Free Sequence Format Reference -->
      <div class="card p-4 mt-4">
        <h3 class="font-bold text-base mb-2">Statutory Gap-Free Document Sequences (MySQL Row-Locked)</h3>
        <p class="text-secondary text-xs mb-3">Document numbering is strictly monotonic and audit-compliant per tenant and fiscal year:</p>
        <div class="grid grid-4 gap-3 text-xs">
          <div class="p-2 border rounded">
            <span class="text-secondary font-semibold">SALES ORDERS</span>
            <div class="font-mono font-bold mt-1 text-primary">{{ tenant.code === 'ZENITH_IND' ? 'Z-SO-0104' : 'SO-01004' }}</div>
          </div>
          <div class="p-2 border rounded">
            <span class="text-secondary font-semibold">TAX INVOICES</span>
            <div class="font-mono font-bold mt-1 text-primary">{{ tenant.code === 'ZENITH_IND' ? 'Z-INV-0203' : 'INV-05003' }}</div>
          </div>
          <div class="p-2 border rounded">
            <span class="text-secondary font-semibold">WORK ORDERS</span>
            <div class="font-mono font-bold mt-1 text-primary">{{ tenant.code === 'ZENITH_IND' ? 'Z-WO-0101' : 'WO-01003' }}</div>
          </div>
          <div class="p-2 border rounded">
            <span class="text-secondary font-semibold">DELIVERY NOTES</span>
            <div class="font-mono font-bold mt-1 text-primary">{{ tenant.code === 'ZENITH_IND' ? 'Z-DN-0001' : 'DN-04002' }}</div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TenantSettingsComponent implements OnInit {
  tenant!: Tenant;

  constructor(
    public authService: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.authService.currentTenant$.subscribe(t => {
      this.tenant = { ...t, settings: { ...t.settings } };
    });
  }

  saveSettings(): void {
    this.toast.success(`Tenant settings updated for ${this.tenant.name}.`);
  }
}
