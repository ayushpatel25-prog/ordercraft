import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { OrdercraftDataService } from '../../core/services/ordercraft-data.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardSummary, ArAgingBucket } from '../../core/models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-page">
      <!-- Executive Welcome & Command Banner -->
      <div class="command-banner oc-card">
        <div class="banner-content">
          <div class="banner-kicker">
            <span class="live-dot"></span>
            <span>MANUFACTURING COMMAND COCKPIT &bull; {{ authService.currentTenantValue?.name }}</span>
          </div>
          <h1 class="banner-title">
            Operations & Financial Telemetry
          </h1>
          <p class="banner-desc">
            Active Persona: <strong class="role-highlight">{{ formatRole(authService.currentRole) }}</strong>
            &bull; Enterprise Order-to-Cash & Procure-to-Pay Real-Time Synchronization
          </p>
        </div>
        <div class="banner-actions">
          <button class="btn btn-banner-secondary" (click)="refresh()" title="Reload data">
            <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Sync Data
          </button>
          <button *ngIf="authService.hasRole(['SALES', 'SALES_EXECUTIVE', 'SALES_MANAGER', 'ADMIN'])" 
                  class="btn btn-banner-primary" 
                  (click)="navigate('/orders')">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M12 4v16m8-8H4"/>
            </svg>
            New Sales Order
          </button>
          <button *ngIf="authService.hasRole(['PRODUCTION_PLANNER', 'PRODUCTION_MANAGER', 'ADMIN'])" 
                  class="btn btn-banner-success" 
                  (click)="navigate('/work-orders')">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
            Schedule Build
          </button>
        </div>
      </div>

      <!-- Critical Inventory Low Stock Alert Banner -->
      <div *ngIf="summary.lowStockItems > 0 && authService.hasRole(['PROCUREMENT_OFFICER', 'ADMIN', 'PRODUCTION_MANAGER', 'STORE_KEEPER'])" 
           class="alert-banner oc-card">
        <div class="alert-icon-box">
          <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <div class="alert-content">
          <strong>Attention: {{ summary.lowStockItems }} critical manufacturing material(s) below reorder safety stock!</strong>
          <span>Immediate purchase requisitions are suggested to avoid assembly halts on open Work Orders.</span>
        </div>
        <button class="btn btn-sm btn-warning" (click)="navigate('/inventory')">Resolve in SCM &rarr;</button>
      </div>

      <!-- 5 Key KPI Metric Cards -->
      <div class="kpi-grid">
        <!-- 1. Total Orders -->
        <div class="kpi-card oc-card" (click)="navigate('/orders')">
          <div class="kpi-top">
            <span class="kpi-label">TOTAL SALES ORDERS</span>
            <div class="kpi-icon-bubble icon-blue">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
              </svg>
            </div>
          </div>
          <div class="kpi-number text-mono">{{ summary.totalOrders }}</div>
          <div class="kpi-footer">
            <span class="badge badge-info">{{ summary.pendingOrders }} In Queue</span>
            <span class="badge badge-success">{{ summary.completedOrders }} Completed</span>
          </div>
        </div>

        <!-- 2. Active In-Production -->
        <div class="kpi-card oc-card" (click)="navigate('/work-orders')">
          <div class="kpi-top">
            <span class="kpi-label">PLANT WORK ORDERS</span>
            <div class="kpi-icon-bubble icon-purple">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
          </div>
          <div class="kpi-number text-mono">{{ summary.productionOrders }}</div>
          <div class="kpi-footer">
            <span class="kpi-trend text-primary font-semibold">Active shop-floor lines</span>
            <span class="badge badge-neutral">OTD {{ summary.onTimeDeliveryPct }}%</span>
          </div>
        </div>

        <!-- 3. Low Stock Items -->
        <div class="kpi-card oc-card" (click)="navigate('/inventory')">
          <div class="kpi-top">
            <span class="kpi-label">SHORTAGE ALERTS</span>
            <div class="kpi-icon-bubble icon-amber">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
            </div>
          </div>
          <div class="kpi-number text-mono" [style.color]="summary.lowStockItems > 0 ? 'var(--warning-hover)' : 'var(--slate-900)'">
            {{ summary.lowStockItems }}
          </div>
          <div class="kpi-footer">
            <span *ngIf="summary.lowStockItems > 0" class="badge badge-warning">Action Required</span>
            <span *ngIf="summary.lowStockItems === 0" class="badge badge-success">Stock Optimal</span>
          </div>
        </div>

        <!-- 4. Total Billed Revenue -->
        <div class="kpi-card oc-card" (click)="navigate('/invoices')">
          <div class="kpi-top">
            <span class="kpi-label">TOTAL BILLED REVENUE</span>
            <div class="kpi-icon-bubble icon-green">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
          <div class="kpi-number text-mono font-bold text-success">
            {{ authService.currencySymbol }}{{ summary.totalRevenue | number:'1.0-0' }}
          </div>
          <div class="kpi-footer">
            <span class="kpi-subtext">Collected: {{ authService.currencySymbol }}{{ summary.collectedPayments | number:'1.0-0' }}</span>
          </div>
        </div>

        <!-- 5. Outstanding Receivables -->
        <div class="kpi-card oc-card" (click)="navigate('/payments')">
          <div class="kpi-top">
            <span class="kpi-label">OPEN RECEIVABLES</span>
            <div class="kpi-icon-bubble icon-red">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2z"/>
              </svg>
            </div>
          </div>
          <div class="kpi-number text-mono font-bold" [style.color]="summary.pendingPayments > 0 ? 'var(--danger)' : 'var(--slate-900)'">
            {{ authService.currencySymbol }}{{ summary.pendingPayments | number:'1.0-0' }}
          </div>
          <div class="kpi-footer">
            <span class="badge badge-warning">{{ summary.outstandingInvoices }} Unpaid Invoices</span>
          </div>
        </div>
      </div>

      <!-- Analytical Insights Grid -->
      <div class="charts-grid">
        <!-- Monthly Inflow & Revenue Velocity -->
        <div class="oc-card chart-card">
          <div class="oc-card-header">
            <div>
              <div style="font-weight: 700; font-size: 0.95rem; color: var(--slate-900);">Monthly Manufacturing Revenue Velocity</div>
              <div style="font-size: 0.75rem; color: var(--slate-500);">Billed revenue & order throughput trajectory across fiscal quarters</div>
            </div>
            <div class="chart-legend">
              <span class="legend-item"><span class="legend-dot dot-primary"></span> Revenue ({{ authService.currencySymbol }})</span>
            </div>
          </div>
          <div class="oc-card-body">
            <div class="chart-bars-container">
              <div *ngFor="let item of summary.revenueTrend; let i = index" class="bar-col">
                <div class="bar-track">
                  <div class="bar-fill" [style.height.%]="getBarHeightPct(item.revenue)">
                    <span class="bar-tooltip">{{ authService.currencySymbol }}{{ formatShortAmount(item.revenue) }}</span>
                  </div>
                </div>
                <div class="bar-label">{{ item.period }}</div>
                <div class="bar-sub">{{ summary.ordersTrend[i]?.orders || 0 }} Orders</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Shop Floor Production Status Breakdown -->
        <div class="oc-card chart-card">
          <div class="oc-card-header">
            <div>
              <div style="font-weight: 700; font-size: 0.95rem; color: var(--slate-900);">Work Order Distribution</div>
              <div style="font-size: 0.75rem; color: var(--slate-500);">Live manufacturing assembly progress</div>
            </div>
            <button class="btn btn-sm btn-outline-primary" (click)="navigate('/work-orders')">View Line &rarr;</button>
          </div>
          <div class="oc-card-body">
            <div class="status-breakdown-list">
              <div *ngFor="let s of summary.productionStatusDistribution" class="breakdown-item">
                <div class="breakdown-label">
                  <span class="badge" [ngClass]="'badge-' + s.status.toLowerCase()">{{ s.status }}</span>
                  <span class="text-mono font-bold text-sm">{{ s.count }} Orders</span>
                </div>
                <div class="progress-track">
                  <div class="progress-bar" 
                       [style.width.%]="summary.totalOrders > 0 ? (s.count / summary.totalOrders) * 100 : 50"
                       [style.background]="getStatusGradient(s.status)"></div>
                </div>
              </div>

              <div *ngIf="summary.productionStatusDistribution.length === 0" style="color: var(--slate-400); text-align: center; padding: 24px;">
                No active production work orders
              </div>
            </div>

            <!-- Real-Time AR Aging Summary Snippet -->
            <div class="ar-aging-section" *ngIf="arAgingBuckets.length > 0">
              <div class="ar-aging-title">ACCOUNTS RECEIVABLE AGING (AR)</div>
              <div class="ar-buckets-grid">
                <div *ngFor="let b of arAgingBuckets" class="ar-bucket-pill">
                  <span class="ar-bucket-name">{{ b.bucket }}</span>
                  <span class="ar-bucket-amount text-mono font-bold">{{ authService.currencySymbol }}{{ b.totalOutstanding | number:'1.0-0' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Enterprise OTC & PTP Interactive Lifecycle Stepper -->
      <div class="oc-card workflow-card">
        <div class="oc-card-header">
          <div class="flex items-center gap-2">
            <div class="lifecycle-icon-wrap">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <div>
              <div style="font-weight: 800; font-size: 0.95rem; color: var(--slate-900);">Automated Order-to-Cash & Procure-to-Pay Lifecycle</div>
              <div style="font-size: 0.75rem; color: var(--slate-500);">Click any stage to inspect live module records</div>
            </div>
          </div>
          <span class="badge badge-success">Shared Schema Validated</span>
        </div>
        <div class="oc-card-body p-3">
          <div class="workflow-stepper">
            <div class="step-card" (click)="navigate('/customers')">
              <div class="step-badge">1</div>
              <div class="step-title">Customer Setup</div>
              <div class="step-subtitle">Master CRM & Credit</div>
            </div>

            <div class="step-divider">&rarr;</div>

            <div class="step-card" (click)="navigate('/orders')">
              <div class="step-badge">2</div>
              <div class="step-title">Sales Order</div>
              <div class="step-subtitle">Quotation & Approvals</div>
            </div>

            <div class="step-divider">&rarr;</div>

            <div class="step-card" (click)="navigate('/bom')">
              <div class="step-badge">3</div>
              <div class="step-title">BOM Explosion</div>
              <div class="step-subtitle">Recursive Stock Check</div>
            </div>

            <div class="step-divider">&rarr;</div>

            <div class="step-card" (click)="navigate('/purchase-orders')">
              <div class="step-badge">4</div>
              <div class="step-title">Procurement PO</div>
              <div class="step-subtitle">GRN & 3-Way Match</div>
            </div>

            <div class="step-divider">&rarr;</div>

            <div class="step-card" (click)="navigate('/work-orders')">
              <div class="step-badge">5</div>
              <div class="step-title">Work Orders</div>
              <div class="step-subtitle">Shop Floor Assembly</div>
            </div>

            <div class="step-divider">&rarr;</div>

            <div class="step-card" (click)="navigate('/dispatch')">
              <div class="step-badge">6</div>
              <div class="step-title">Dispatch & DN</div>
              <div class="step-subtitle">Physical Stock Deduction</div>
            </div>

            <div class="step-divider">&rarr;</div>

            <div class="step-card" (click)="navigate('/invoices')">
              <div class="step-badge">7</div>
              <div class="step-title">Invoicing & AR</div>
              <div class="step-subtitle">Tax & Settlement</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page {
      display: flex;
      flex-direction: column;
      gap: 22px;
      animation: pageFadeIn 0.3s ease-out;
    }

    /* Executive Command Banner */
    .command-banner {
      padding: 26px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 24px;
      background: linear-gradient(135deg, #090e17 0%, #151c33 50%, #0f172a 100%);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: var(--radius-xl);
      box-shadow: 0 16px 36px -8px rgba(15, 23, 42, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15);
      position: relative;
      overflow: hidden;
    }

    .command-banner::after {
      content: '';
      position: absolute;
      top: -50%;
      right: -10%;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(59, 130, 246, 0.22) 0%, transparent 70%);
      pointer-events: none;
    }

    .banner-kicker {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 0.09em;
      color: #60a5fa;
      background: rgba(37, 99, 235, 0.18);
      border: 1px solid rgba(96, 165, 250, 0.25);
      padding: 4px 10px;
      border-radius: 999px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }

    .live-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 10px #10b981;
      animation: pulseLiveDot 2s infinite;
    }

    @keyframes pulseLiveDot {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.3); opacity: 0.7; box-shadow: 0 0 14px #10b981; }
    }

    .banner-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.03em;
      line-height: 1.2;
    }

    .banner-desc {
      font-size: 0.84rem;
      color: #94a3b8;
      margin-top: 6px;
    }

    .role-highlight {
      color: #f1f5f9;
      font-weight: 700;
      background: rgba(255, 255, 255, 0.12);
      padding: 2px 7px;
      border-radius: 4px;
    }

    .banner-actions {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
      z-index: 2;
    }

    .btn-banner-secondary {
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.22);
      backdrop-filter: blur(8px);
    }
    .btn-banner-secondary:hover {
      background: rgba(255, 255, 255, 0.18);
      border-color: rgba(255, 255, 255, 0.35);
      color: #ffffff;
    }

    .btn-banner-primary {
      background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
    }
    .btn-banner-primary:hover {
      box-shadow: 0 6px 20px rgba(37, 99, 235, 0.55);
      transform: translateY(-1px);
    }

    .btn-banner-success {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
    }
    .btn-banner-success:hover {
      box-shadow: 0 6px 20px rgba(16, 185, 129, 0.55);
      transform: translateY(-1px);
    }

    /* Alert Banner */
    .alert-banner {
      background: linear-gradient(90deg, #fffbeb 0%, #fef3c7 100%);
      border: 1px solid #fde68a;
      padding: 14px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      border-radius: var(--radius-lg);
    }

    .alert-icon-box {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: rgba(245, 158, 11, 0.15);
      color: #b45309;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .alert-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      font-size: 0.82rem;
      color: #92400e;
    }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 16px;
    }

    @media (max-width: 1280px) {
      .kpi-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }

    @media (max-width: 768px) {
      .kpi-grid {
        grid-template-columns: repeat(1, minmax(0, 1fr));
      }
    }

    .kpi-card {
      padding: 22px 20px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 148px;
      background: #ffffff;
      border-radius: var(--radius-lg);
      border: 1px solid rgba(226, 232, 240, 0.9);
      position: relative;
      transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .kpi-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: transparent;
      border-radius: var(--radius-lg) var(--radius-lg) 0 0;
      transition: background 0.3s ease;
    }

    .kpi-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 28px -4px rgba(15, 23, 42, 0.08);
      border-color: rgba(191, 219, 254, 0.8);
    }

    .kpi-card:nth-child(1):hover::before { background: linear-gradient(90deg, #2563eb, #38bdf8); }
    .kpi-card:nth-child(2):hover::before { background: linear-gradient(90deg, #7c3aed, #c084fc); }
    .kpi-card:nth-child(3):hover::before { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
    .kpi-card:nth-child(4):hover::before { background: linear-gradient(90deg, #10b981, #34d399); }
    .kpi-card:nth-child(5):hover::before { background: linear-gradient(90deg, #ef4444, #f87171); }

    .kpi-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
    }

    .kpi-label {
      font-size: 0.68rem;
      font-weight: 800;
      color: var(--slate-400);
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .kpi-icon-bubble {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
      transition: transform 0.2s ease;
    }

    .kpi-card:hover .kpi-icon-bubble {
      transform: scale(1.08) rotate(-3deg);
    }

    .icon-blue { background: #eff6ff; color: #2563eb; }
    .icon-purple { background: #f5f3ff; color: #7c3aed; }
    .icon-amber { background: #fffbeb; color: #d97706; }
    .icon-green { background: #ecfdf5; color: #059669; }
    .icon-red { background: #fef2f2; color: #dc2626; }

    .kpi-number {
      font-size: 1.85rem;
      font-weight: 800;
      color: var(--slate-950);
      margin: 10px 0 6px 0;
      letter-spacing: -0.03em;
      line-height: 1;
    }

    .kpi-footer {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .kpi-subtext {
      font-size: 0.72rem;
      color: var(--slate-500);
      font-weight: 600;
    }

    .kpi-trend {
      font-size: 0.72rem;
    }

    /* Charts Grid */
    .charts-grid {
      display: grid;
      grid-template-columns: 3fr 2fr;
      gap: 20px;
    }

    @media (max-width: 1024px) {
      .charts-grid {
        grid-template-columns: 1fr;
      }
    }

    .chart-card {
      display: flex;
      flex-direction: column;
    }

    .chart-legend {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 0.75rem;
      color: var(--slate-600);
      font-weight: 600;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .dot-primary { background: var(--primary); }

    .chart-bars-container {
      display: flex;
      align-items: flex-end;
      justify-content: space-around;
      height: 220px;
      padding-top: 30px;
      border-bottom: 1px solid var(--slate-200);
    }

    .bar-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 48px;
      height: 100%;
      justify-content: flex-end;
    }

    .bar-track {
      width: 32px;
      height: 160px;
      background: var(--slate-100);
      border-radius: 8px 8px 0 0;
      display: flex;
      align-items: flex-end;
      position: relative;
    }

    .bar-fill {
      width: 100%;
      background: linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%);
      border-radius: 8px 8px 0 0;
      position: relative;
      transition: height 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .bar-tooltip {
      position: absolute;
      top: -24px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.68rem;
      font-weight: 800;
      color: var(--primary);
      white-space: nowrap;
      font-family: var(--font-mono);
    }

    .bar-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--slate-700);
      margin-top: 8px;
    }

    .bar-sub {
      font-size: 0.62rem;
      color: var(--slate-400);
      font-weight: 600;
    }

    .status-breakdown-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .breakdown-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .breakdown-label {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .progress-track {
      width: 100%;
      height: 8px;
      background: var(--slate-100);
      border-radius: 9999px;
      overflow: hidden;
    }

    .progress-bar {
      height: 100%;
      border-radius: 9999px;
      transition: width 0.4s ease;
    }

    .ar-aging-section {
      margin-top: 22px;
      padding-top: 16px;
      border-top: 1px solid var(--slate-150);
    }

    .ar-aging-title {
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      color: var(--slate-400);
      margin-bottom: 8px;
    }

    .ar-buckets-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }

    .ar-bucket-pill {
      background: var(--slate-50);
      border: 1px solid var(--slate-200);
      border-radius: 8px;
      padding: 8px 10px;
      display: flex;
      flex-direction: column;
    }

    .ar-bucket-name {
      font-size: 0.65rem;
      color: var(--slate-500);
      font-weight: 700;
    }

    .ar-bucket-amount {
      font-size: 0.8rem;
      color: var(--slate-900);
      margin-top: 2px;
    }

    /* Workflow Stepper */
    .lifecycle-icon-wrap {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: var(--primary-light);
      color: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .workflow-stepper {
      display: flex;
      align-items: center;
      justify-content: space-between;
      overflow-x: auto;
      padding: 14px 6px;
      gap: 10px;
    }

    .step-card {
      background: #ffffff;
      border: 1px solid var(--slate-200);
      border-radius: var(--radius-md);
      padding: 16px 14px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      cursor: pointer;
      min-width: 140px;
      flex: 1;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: var(--shadow-xs);
      position: relative;
    }

    .step-card:hover {
      border-color: var(--primary);
      background: #fafbfc;
      transform: translateY(-3px);
      box-shadow: 0 8px 20px -2px rgba(37, 99, 235, 0.15);
    }

    .step-badge {
      width: 28px;
      height: 28px;
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: #ffffff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.76rem;
      font-weight: 800;
      margin-bottom: 8px;
      box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3);
      transition: transform 0.2s ease;
    }

    .step-card:hover .step-badge {
      transform: scale(1.12);
      background: linear-gradient(135deg, #1d4ed8 0%, #4f46e5 100%);
    }

    .step-title {
      font-size: 0.84rem;
      font-weight: 700;
      color: var(--slate-900);
      white-space: nowrap;
    }

    .step-subtitle {
      font-size: 0.68rem;
      color: var(--slate-500);
      margin-top: 2px;
      white-space: nowrap;
    }

    .step-divider {
      color: var(--slate-300);
      font-size: 1.25rem;
      font-weight: bold;
      user-select: none;
      flex-shrink: 0;
    }
  `]
})
export class DashboardComponent implements OnInit {
  summary!: DashboardSummary;
  arAgingBuckets: ArAgingBucket[] = [];

  constructor(
    private dataService: OrdercraftDataService,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.summary = this.dataService.getDashboardSummary();
    try {
      this.arAgingBuckets = this.dataService.getArAgingSummary();
    } catch (e) {
      this.arAgingBuckets = [];
    }
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }

  formatRole(role?: string): string {
    if (!role) return 'Enterprise User';
    return role.replace(/_/g, ' ');
  }

  getBarHeightPct(revenue: number): number {
    const max = 1000000;
    return Math.min(100, Math.max(15, (revenue / max) * 100));
  }

  formatShortAmount(amt: number): string {
    if (amt >= 1000000) return (amt / 1000000).toFixed(1) + 'M';
    if (amt >= 100000) return (amt / 100000).toFixed(1) + 'L';
    if (amt >= 1000) return (amt / 1000).toFixed(0) + 'k';
    return amt.toString();
  }

  getStatusGradient(status: string): string {
    switch (status) {
      case 'IN_PROGRESS': return 'linear-gradient(90deg, #0ea5e9, #0284c7)';
      case 'COMPLETED': return 'linear-gradient(90deg, #10b981, #059669)';
      case 'ON_HOLD': return 'linear-gradient(90deg, #f59e0b, #d97706)';
      case 'PLANNED': return 'linear-gradient(90deg, #94a3b8, #64748b)';
      default: return 'linear-gradient(90deg, #2563eb, #1d4ed8)';
    }
  }
}
