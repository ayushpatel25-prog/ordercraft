import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { UserRole } from '../../core/models/models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-wrapper">
      <div class="login-card oc-card">
        <div class="login-header">
          <div class="logo-box">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
            </svg>
          </div>
          <h2>ORDERCRAFT</h2>
          <p class="subtitle">Enterprise Manufacturing Order Management System</p>
          <div class="tenant-tag">
            <span class="live-dot"></span>
            Multi-Tenant Isolated Engine &bull; SOC 2 Ready
          </div>
        </div>

        <!-- Quick 1-Click Role Logins -->
        <div class="demo-role-quickbar">
          <span class="quick-title">Quick Demo Login (Evaluator Fast-Track):</span>
          <div class="quick-buttons">
            <button type="button" class="quick-btn btn-admin" (click)="quickLogin('ADMIN')" title="Tenant Admin">
              👑 Admin
            </button>
            <button type="button" class="quick-btn btn-sales" (click)="quickLogin('SALES')" title="Sales Executive">
              💼 Sales
            </button>
            <button type="button" class="quick-btn btn-prod" (click)="quickLogin('PRODUCTION_MANAGER')" title="Production Planner">
              🏭 Production
            </button>
            <button type="button" class="quick-btn btn-proc" (click)="quickLogin('PROCUREMENT_OFFICER')" title="Procurement Officer">
              📦 Procurement
            </button>
            <button type="button" class="quick-btn btn-fin" (click)="quickLogin('FINANCE_OFFICER')" title="Finance Officer">
              💳 Finance
            </button>
          </div>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
          <div class="form-group">
            <label class="form-label">Enterprise Email Address</label>
            <div class="input-with-icon">
              <svg class="input-icon" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"/>
              </svg>
              <input type="email" 
                     formControlName="email" 
                     class="form-control" 
                     placeholder="name@company.com" />
            </div>
            <div *ngIf="loginForm.get('email')?.touched && loginForm.get('email')?.invalid" class="form-error">
              Please enter a valid work email address
            </div>
          </div>

          <div class="form-group">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <label class="form-label" style="margin-bottom: 0;">Password</label>
              <a href="javascript:void(0)" (click)="toast.info('Default demo password is Password@123')" class="forgot-link">Default: Password&#64;123</a>
            </div>
            <div class="input-with-icon">
              <svg class="input-icon" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              <input type="password" 
                     formControlName="password" 
                     class="form-control" 
                     placeholder="••••••••••••" />
            </div>
            <div *ngIf="loginForm.get('password')?.touched && loginForm.get('password')?.invalid" class="form-error">
              Password must be at least 8 characters
            </div>
          </div>

          <div class="remember-row">
            <label class="checkbox-label">
              <input type="checkbox" formControlName="rememberMe" />
              <span>Remember this session (7 days)</span>
            </label>
          </div>

          <button type="submit" [disabled]="loginForm.invalid || isSubmitting" class="btn btn-primary submit-btn">
            <span *ngIf="isSubmitting" class="flex-center gap-2">
              <svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-linecap="round"></circle>
              </svg>
              Authenticating Credentials...
            </span>
            <span *ngIf="!isSubmitting">Sign In to OrderCraft Workspace &rarr;</span>
          </button>
        </form>

        <div class="login-footer">
          <div class="compliance-row">
            <span class="compliance-badge">&bull; 256-Bit TLS</span>
            <span class="compliance-badge">&bull; Multi-Tenant Shared Schema</span>
            <span class="compliance-badge">&bull; Flyway Migrations</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      width: 100%;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at 15% 20%, rgba(37, 99, 235, 0.15) 0%, transparent 40%),
                  radial-gradient(circle at 85% 80%, rgba(79, 70, 229, 0.18) 0%, transparent 45%),
                  #090d16;
      padding: 24px;
    }

    .login-card {
      width: 100%;
      max-width: 460px;
      padding: 38px 36px;
      background: rgba(255, 255, 255, 0.98);
      border-radius: var(--radius-xl);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(16px);
      animation: modalSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .login-header {
      text-align: center;
      margin-bottom: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .logo-box {
      width: 58px;
      height: 58px;
      background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #06b6d4 100%);
      color: #ffffff;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 14px;
      box-shadow: 0 10px 20px -3px rgba(37, 99, 235, 0.4);
    }

    h2 {
      font-size: 1.55rem;
      font-weight: 800;
      color: var(--slate-950);
      letter-spacing: -0.03em;
      line-height: 1.1;
    }

    .subtitle {
      font-size: 0.8125rem;
      color: var(--slate-500);
      margin-top: 5px;
    }

    .tenant-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 10px;
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--primary);
      background: var(--primary-light);
      border: 1px solid var(--primary-border);
      padding: 3px 10px;
      border-radius: 9999px;
    }

    .live-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10b981;
    }

    .demo-role-quickbar {
      background: var(--slate-50);
      border: 1px dashed var(--slate-300);
      border-radius: var(--radius-md);
      padding: 12px;
      margin-bottom: 22px;
    }

    .quick-title {
      display: block;
      font-size: 0.68rem;
      font-weight: 800;
      color: var(--slate-500);
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .quick-buttons {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 5px;
    }

    .quick-btn {
      padding: 6px 4px;
      border-radius: 6px;
      border: 1px solid var(--slate-200);
      background: #ffffff;
      font-size: 0.72rem;
      font-weight: 700;
      cursor: pointer;
      color: var(--slate-700);
      transition: all 0.15s ease;
      white-space: nowrap;
      text-align: center;
    }

    .quick-btn:hover {
      background: var(--primary-light);
      border-color: var(--primary-border);
      color: var(--primary);
      transform: translateY(-1px);
    }

    .input-with-icon {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 13px;
      color: var(--slate-400);
      pointer-events: none;
    }

    .input-with-icon .form-control {
      padding-left: 38px;
    }

    .forgot-link {
      font-size: 0.75rem;
      color: var(--primary);
      text-decoration: none;
      font-weight: 600;
    }

    .forgot-link:hover {
      text-decoration: underline;
    }

    .remember-row {
      margin-bottom: 20px;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8125rem;
      color: var(--slate-600);
      cursor: pointer;
    }

    .submit-btn {
      width: 100%;
      padding: 12px;
      font-size: 0.92rem;
      border-radius: var(--radius-md);
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
    }

    .form-error {
      font-size: 0.74rem;
      color: var(--danger);
      margin-top: 5px;
      font-weight: 600;
    }

    .login-footer {
      text-align: center;
      margin-top: 24px;
      padding-top: 18px;
      border-top: 1px solid var(--slate-200);
    }

    .compliance-row {
      display: flex;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .compliance-badge {
      font-size: 0.68rem;
      font-weight: 700;
      color: var(--slate-400);
    }

    .spinner {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    public toast: ToastService
  ) {
    this.loginForm = this.fb.group({
      email: ['admin@ordercraft.com', [Validators.required, Validators.email]],
      password: ['Password@123', [Validators.required, Validators.minLength(8)]],
      rememberMe: [true]
    });
  }

  quickLogin(role: UserRole): void {
    const user = this.authService.DEMO_USERS[role];
    this.loginForm.patchValue({
      email: user.email,
      password: 'Password@123'
    });
    this.onSubmit();
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isSubmitting = true;
    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.toast.success(`Welcome back, ${res.name}! Logged in as ${res.roles[0].replace('ROLE_', '')}.`);
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.isSubmitting = false;
        this.toast.error('Invalid credentials. Please verify your email and password.');
      }
    });
  }
}
