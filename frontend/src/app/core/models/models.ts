// =====================================================================
// ORDERCRAFT: Multi-Tenant Enterprise OMS Domain Models
// =====================================================================

export type EnterpriseRole =
  | 'PLATFORM_ADMIN'
  | 'TENANT_ADMIN'
  | 'SALES_EXECUTIVE'
  | 'SALES_MANAGER'
  | 'PRODUCTION_PLANNER'
  | 'PROCUREMENT_OFFICER'
  | 'STORE_KEEPER'
  | 'FINANCE_USER'
  | 'VIEWER';

// Compatibility alias for existing components
export type UserRole =
  | EnterpriseRole
  | 'ADMIN'
  | 'SALES'
  | 'PRODUCTION_MANAGER'
  | 'PROCUREMENT_OFFICER'
  | 'FINANCE_OFFICER';

export interface TenantSettings {
  approvalThreshold: number;
  maxDiscountPct: number;
  taxRegime: string;
  fiscalYear: string;
  lockoutThreshold: number;
}

export interface Tenant {
  id: number;
  publicId: string;
  code: string;
  name: string;
  plan: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'ONBOARDING';
  timezone: string;
  currency: string;
  currencySymbol: string;
  plantLocation: string;
  settings: TenantSettings;
}

export interface User {
  id: number;
  tenantId?: number;
  name: string;
  email: string;
  roles: string[];
  isActive: boolean;
  failedAttempts?: number;
  lockedUntil?: string | null;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  id: number;
  tenantId: number;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export interface Customer {
  id: number;
  tenantId?: number;
  name: string;
  code?: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  taxId?: string; // GSTIN / Tax ID
  creditLimit: number;
  paymentTermsDays: number;
  openReceivables?: number;
  status: 'ACTIVE' | 'INACTIVE';
  totalOrdersCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  tenantId?: number;
  name: string;
  sku: string;
  description: string;
  unitPrice: number;
  unit: string;
  category: 'FINISHED_GOOD' | 'RAW_MATERIAL' | 'SUB_ASSEMBLY';
  taxRate?: number;
  standardCost?: number;
  reorderLevel?: number;
  status: 'ACTIVE' | 'INACTIVE';
  currentStock?: number;
  availableStock?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BomItem {
  id?: number;
  materialId: number;
  materialName?: string;
  materialSku?: string;
  quantityRequired: number;
  scrapPercentage?: number;
  unit: string;
  availableStock?: number;
}

export interface Bom {
  id: number;
  tenantId?: number;
  productId: number;
  productName: string;
  productSku: string;
  version: string;
  description: string;
  status: 'ACTIVE' | 'DRAFT' | 'OBSOLETE' | 'INACTIVE';
  items: BomItem[];
  createdAt: string;
  updatedAt: string;
}

export interface BomExplosionItem {
  materialId: number;
  materialName: string;
  materialSku: string;
  unitRequirement: number;
  scrapPercentage?: number;
  totalRequired: number;
  availableStock: number;
  shortageQuantity: number;
  isSufficient: boolean;
  unit: string;
}

export interface Inventory {
  id: number;
  tenantId?: number;
  productId: number;
  productName: string;
  productSku: string;
  productCategory: string;
  unit: string;
  quantity: number;
  currentStock?: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderLevel: number;
  unitPrice?: number;
  movingAverageCost?: number;
  location: string;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  lastUpdated: string;
}

export interface InventoryTransaction {
  id: number;
  tenantId?: number;
  productId: number;
  productName: string;
  productSku: string;
  transactionType: 'RECEIPT' | 'RESERVE' | 'RELEASE' | 'CONSUMED' | 'DISPATCH' | 'ADJUSTED' | 'RECEIVED' | 'RESERVED' | 'RELEASED';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  unitCost?: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  performedBy?: string;
  createdAt: string;
}

export interface SalesOrderItem {
  id?: number;
  productId: number;
  productName?: string;
  productSku?: string;
  unit?: string;
  quantity: number;
  unitPrice: number;
  discountPct?: number;
  taxRate?: number;
  totalPrice?: number;
  availableStock?: number;
  hasBom?: boolean;
}

export interface SalesOrder {
  id: number;
  tenantId?: number;
  orderNumber: string;
  customerId: number;
  customerName: string;
  customerEmail: string;
  orderDate: string;
  expectedDeliveryDate: string;
  status:
    | 'DRAFT'
    | 'SUBMITTED'
    | 'APPROVAL_PENDING'
    | 'APPROVED'
    | 'CONFIRMED'
    | 'IN_PROGRESS'
    | 'READY_TO_SHIP'
    | 'PARTIALLY_SHIPPED'
    | 'SHIPPED'
    | 'INVOICED'
    | 'PARTIALLY_COMPLETED'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'CLOSED';
  subtotal: number;
  discountTotal?: number;
  taxAmount: number;
  totalAmount: number;
  revisionNo?: number;
  requiresApproval?: boolean;
  approvalReason?: string;
  createdBy: string;
  approvedBy?: string;
  items: SalesOrderItem[];
  associatedWorkOrderId?: number;
  associatedWorkOrderNumber?: string;
  associatedDeliveryNoteId?: number;
  associatedDeliveryNoteNumber?: string;
  associatedInvoiceId?: number;
  associatedInvoiceNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkOrder {
  id: number;
  tenantId?: number;
  workOrderNumber: string;
  salesOrderId?: number;
  salesOrderNumber?: string;
  customerName?: string;
  productId: number;
  productName: string;
  productSku: string;
  quantity: number;
  startDate: string;
  expectedEndDate: string;
  actualEndDate?: string;
  status: 'PLANNED' | 'RELEASED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  assignedTo?: string;
  progressPercentage: number;
  notes?: string;
  requiredMaterials?: BomExplosionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: number;
  tenantId?: number;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  rating?: number;
  leadTimeDays?: number;
  status: 'ACTIVE' | 'INACTIVE';
  totalPurchaseOrders?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  id?: number;
  materialId: number;
  materialName?: string;
  materialSku?: string;
  unit?: string;
  quantity: number;
  receivedQuantity: number;
  unitPrice: number;
  totalPrice?: number;
}

export interface PurchaseOrder {
  id: number;
  tenantId?: number;
  purchaseOrderNumber: string;
  supplierId: number;
  supplierName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'SUBMITTED' | 'APPROVED' | 'SENT' | 'ORDERED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CLOSED' | 'CANCELLED';
  subtotal?: number;
  taxAmount?: number;
  totalAmount: number;
  createdBy: string;
  approvedBy?: string;
  items: PurchaseOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface GoodsReceiptLine {
  id?: number;
  productId: number;
  productName: string;
  productSku: string;
  qtyOrdered: number;
  qtyReceived: number;
  qtyAccepted: number;
  qtyRejected: number;
  unitCost: number;
  batchId?: string;
}

export interface GoodsReceipt {
  id: number;
  tenantId?: number;
  grnNumber: string;
  purchaseOrderId: number;
  purchaseOrderNumber: string;
  supplierId: number;
  supplierName: string;
  receiptDate: string;
  deliveryChallanNo: string;
  status: 'COMPLETED' | 'CANCELLED';
  qcStatus: 'PASSED' | 'REJECTED' | 'PARTIAL';
  receivedBy: string;
  lines: GoodsReceiptLine[];
  createdAt: string;
}

export interface ThreeWayMatchRecord {
  poId: number;
  poNumber: string;
  supplierName: string;
  poTotal: number;
  grnNumber: string;
  grnAcceptedValue: number;
  invoiceNumber: string;
  invoiceTotal: number;
  varianceAmount: number;
  status: 'MATCHED' | 'DISCREPANCY' | 'PENDING_GRN';
  toleranceExceeded: boolean;
}

export interface DeliveryNoteLine {
  id?: number;
  orderLineId: number;
  productId: number;
  productName: string;
  productSku: string;
  qtyDispatched: number;
  unit: string;
}

export interface DeliveryNote {
  id: number;
  tenantId?: number;
  dnNumber: string;
  salesOrderId: number;
  salesOrderNumber: string;
  customerId: number;
  customerName: string;
  dispatchDate: string;
  transporterName: string;
  trackingNo: string;
  status: 'DRAFT' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';
  dispatchedBy: string;
  lines: DeliveryNoteLine[];
  createdAt: string;
}

export interface Invoice {
  id: number;
  tenantId?: number;
  invoiceNumber: string;
  salesOrderId: number;
  salesOrderNumber: string;
  deliveryNoteId?: number;
  deliveryNoteNumber?: string;
  customerId: number;
  customerName: string;
  customerEmail: string;
  customerAddress: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  tax: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
  payments?: Payment[];
  createdAt: string;
}

export interface CreditNote {
  id: number;
  tenantId?: number;
  cnNumber: string;
  invoiceId: number;
  invoiceNumber: string;
  customerId: number;
  customerName: string;
  reason: string;
  amount: number;
  createdBy: string;
  createdAt: string;
}

export interface Payment {
  id: number;
  tenantId?: number;
  paymentReference: string;
  invoiceId: number;
  invoiceNumber: string;
  paymentDate: string;
  amount: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'UPI' | 'CHEQUE';
  transactionReference?: string;
  status: 'COMPLETED' | 'REVERSED';
  notes?: string;
  recordedBy: string;
  createdAt: string;
}

export interface ArAgingBucket {
  bucket: '0-30 Days' | '31-60 Days' | '61-90 Days' | '90+ Days';
  totalOutstanding: number;
  invoiceCount: number;
  invoices: Invoice[];
}

export interface DashboardSummary {
  totalOrders: number;
  pendingOrders: number;
  productionOrders: number;
  completedOrders: number;
  lowStockItems: number;
  pendingPurchaseOrders: number;
  outstandingInvoices: number;
  totalRevenue: number;
  pendingPayments: number;
  collectedPayments: number;
  onTimeDeliveryPct?: number;
  ordersTrend: { period: string; orders: number }[];
  revenueTrend: { period: string; revenue: number }[];
  productionStatusDistribution: { status: string; count: number }[];
  inventoryLevels: { productName: string; available: number; reserved: number; reorderLevel: number; status: string }[];
  orderStatusDistribution: { status: string; count: number }[];
  arAging?: ArAgingBucket[];
}

export interface NotificationItem {
  id: number;
  tenantId?: number;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ALERT';
  targetRole?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLogItem {
  id: number;
  tenantId?: number;
  username: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: string;
  newValue?: string;
  oldJson?: any;
  newJson?: any;
  ipAddress: string;
  timestamp: string;
}
