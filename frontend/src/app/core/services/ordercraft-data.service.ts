import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  ArAgingBucket,
  AuditLogItem,
  Bom,
  BomExplosionItem,
  CreditNote,
  Customer,
  DashboardSummary,
  DeliveryNote,
  DeliveryNoteLine,
  GoodsReceipt,
  GoodsReceiptLine,
  Inventory,
  InventoryTransaction,
  Invoice,
  NotificationItem,
  Payment,
  Product,
  PurchaseOrder,
  PurchaseOrderItem,
  SalesOrder,
  SalesOrderItem,
  Supplier,
  ThreeWayMatchRecord,
  User,
  WorkOrder
} from '../models/models';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class OrdercraftDataService {

  // Master all-tenant repositories (in-memory multi-tenant store)
  private allCustomers: Customer[] = [];
  private allProducts: Product[] = [];
  private allBoms: Bom[] = [];
  private allInventory: Inventory[] = [];
  private allTransactions: InventoryTransaction[] = [];
  private allSalesOrders: SalesOrder[] = [];
  private allWorkOrders: WorkOrder[] = [];
  private allSuppliers: Supplier[] = [];
  private allPurchaseOrders: PurchaseOrder[] = [];
  private allGoodsReceipts: GoodsReceipt[] = [];
  private allDeliveryNotes: DeliveryNote[] = [];
  private allInvoices: Invoice[] = [];
  private allCreditNotes: CreditNote[] = [];
  private allPayments: Payment[] = [];
  private allNotifications: NotificationItem[] = [];
  private allAuditLogs: AuditLogItem[] = [];
  private allUsers: User[] = [];

  // Scoped reactive streams for the CURRENT active tenant
  private customersSub = new BehaviorSubject<Customer[]>([]);
  private productsSub = new BehaviorSubject<Product[]>([]);
  private bomsSub = new BehaviorSubject<Bom[]>([]);
  private inventorySub = new BehaviorSubject<Inventory[]>([]);
  private transactionsSub = new BehaviorSubject<InventoryTransaction[]>([]);
  private salesOrdersSub = new BehaviorSubject<SalesOrder[]>([]);
  private workOrdersSub = new BehaviorSubject<WorkOrder[]>([]);
  private suppliersSub = new BehaviorSubject<Supplier[]>([]);
  private purchaseOrdersSub = new BehaviorSubject<PurchaseOrder[]>([]);
  private goodsReceiptsSub = new BehaviorSubject<GoodsReceipt[]>([]);
  private deliveryNotesSub = new BehaviorSubject<DeliveryNote[]>([]);
  private invoicesSub = new BehaviorSubject<Invoice[]>([]);
  private creditNotesSub = new BehaviorSubject<CreditNote[]>([]);
  private paymentsSub = new BehaviorSubject<Payment[]>([]);
  private notificationsSub = new BehaviorSubject<NotificationItem[]>([]);
  private auditLogsSub = new BehaviorSubject<AuditLogItem[]>([]);
  private usersSub = new BehaviorSubject<User[]>([]);

  // Public Observables
  public customers$ = this.customersSub.asObservable();
  public products$ = this.productsSub.asObservable();
  public boms$ = this.bomsSub.asObservable();
  public inventory$ = this.inventorySub.asObservable();
  public transactions$ = this.transactionsSub.asObservable();
  public salesOrders$ = this.salesOrdersSub.asObservable();
  public workOrders$ = this.workOrdersSub.asObservable();
  public suppliers$ = this.suppliersSub.asObservable();
  public purchaseOrders$ = this.purchaseOrdersSub.asObservable();
  public goodsReceipts$ = this.goodsReceiptsSub.asObservable();
  public deliveryNotes$ = this.deliveryNotesSub.asObservable();
  public invoices$ = this.invoicesSub.asObservable();
  public creditNotes$ = this.creditNotesSub.asObservable();
  public payments$ = this.paymentsSub.asObservable();
  public notifications$ = this.notificationsSub.asObservable();
  public auditLogs$ = this.auditLogsSub.asObservable();
  public users$ = this.usersSub.asObservable();

  constructor(
    private authService: AuthService,
    private toast: ToastService
  ) {
    this.seedMultiTenantData();

    // Re-filter when active tenant switches
    this.authService.currentTenant$.subscribe(tenant => {
      this.publishTenantData(tenant.id);
    });
  }

  private get activeTenantId(): number {
    return this.authService.currentTenantValue?.id || 1;
  }

  private publishTenantData(tenantId: number): void {
    this.customersSub.next(this.allCustomers.filter(c => c.tenantId === tenantId));
    this.productsSub.next(this.allProducts.filter(p => p.tenantId === tenantId));
    this.bomsSub.next(this.allBoms.filter(b => b.tenantId === tenantId));
    this.inventorySub.next(this.allInventory.filter(i => i.tenantId === tenantId));
    this.transactionsSub.next(this.allTransactions.filter(t => t.tenantId === tenantId));
    this.salesOrdersSub.next(this.allSalesOrders.filter(o => o.tenantId === tenantId));
    this.workOrdersSub.next(this.allWorkOrders.filter(w => w.tenantId === tenantId));
    this.suppliersSub.next(this.allSuppliers.filter(s => s.tenantId === tenantId));
    this.purchaseOrdersSub.next(this.allPurchaseOrders.filter(p => p.tenantId === tenantId));
    this.goodsReceiptsSub.next(this.allGoodsReceipts.filter(g => g.tenantId === tenantId));
    this.deliveryNotesSub.next(this.allDeliveryNotes.filter(d => d.tenantId === tenantId));
    this.invoicesSub.next(this.allInvoices.filter(i => i.tenantId === tenantId));
    this.creditNotesSub.next(this.allCreditNotes.filter(c => c.tenantId === tenantId));
    this.paymentsSub.next(this.allPayments.filter(p => p.tenantId === tenantId));
    this.notificationsSub.next(this.allNotifications.filter(n => n.tenantId === tenantId));
    this.auditLogsSub.next(this.allAuditLogs.filter(a => a.tenantId === tenantId));
    this.usersSub.next(this.allUsers.filter(u => u.tenantId === tenantId));
  }

  // ==================== SEED INITIAL MULTI-TENANT DATA ====================
  private seedMultiTenantData(): void {
    // 1. Customers (Tenant 1: India, Tenant 2: US)
    this.allCustomers = [
      {
        id: 1,
        tenantId: 1,
        name: 'ABC Manufacturing Pvt Ltd',
        code: 'CUST-ABC',
        email: 'procurement@abcmfg.com',
        phone: '+91 98201 12345',
        address: 'Plot 42, MIDC Industrial Area',
        city: 'Pune',
        state: 'Maharashtra',
        postalCode: '411018',
        taxId: '27AAACA1234A1Z5',
        creditLimit: 1000000,
        paymentTermsDays: 30,
        openReceivables: 165500,
        status: 'ACTIVE',
        totalOrdersCount: 2,
        createdAt: '2026-09-20T10:00:00',
        updatedAt: '2026-09-20T10:00:00'
      },
      {
        id: 2,
        tenantId: 1,
        name: 'Techno Industries',
        code: 'CUST-TECHNO',
        email: 'orders@technoind.com',
        phone: '+91 98450 54321',
        address: '88 Peenya Industrial Estate',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560058',
        taxId: '29BBBCB5678B1Z2',
        creditLimit: 500000,
        paymentTermsDays: 45,
        openReceivables: 0,
        status: 'ACTIVE',
        totalOrdersCount: 1,
        createdAt: '2026-09-22T11:30:00',
        updatedAt: '2026-09-22T11:30:00'
      },
      // Tenant 2 Customers (INR)
      {
        id: 3,
        tenantId: 2,
        name: 'Midwest Turbine Systems India Pvt Ltd',
        code: 'CUST-MIDWEST',
        email: 'orders@midwestturbine.co.in',
        phone: '+91 80 2855 0199',
        address: 'Plot 42, Electronic City Phase 1',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560100',
        taxId: '29AAACM3849J1ZT',
        creditLimit: 2500000,
        paymentTermsDays: 30,
        openReceivables: 873200,
        status: 'ACTIVE',
        totalOrdersCount: 1,
        createdAt: '2026-09-24T09:00:00',
        updatedAt: '2026-09-24T09:00:00'
      },
      {
        id: 4,
        tenantId: 2,
        name: 'Great Lakes Automation India',
        code: 'CUST-GLAKES',
        email: 'supply@glakesauto.in',
        phone: '+91 44 2255 0842',
        address: '400 Guindy Industrial Estate',
        city: 'Chennai',
        state: 'Tamil Nadu',
        postalCode: '600032',
        taxId: '33AAACG9821L1ZA',
        creditLimit: 1500000,
        paymentTermsDays: 30,
        openReceivables: 0,
        status: 'ACTIVE',
        totalOrdersCount: 0,
        createdAt: '2026-09-25T14:00:00',
        updatedAt: '2026-09-25T14:00:00'
      }
    ];

    // 2. Products
    this.allProducts = [
      // Tenant 1 (Pumps & Control Panels)
      { id: 1, tenantId: 1, name: 'Industrial Pump X-500', sku: 'FG-PUMP-500', description: 'Heavy-duty 5HP high-pressure centrifugal water pump', unitPrice: 45000, unit: 'UNIT', category: 'FINISHED_GOOD', taxRate: 18, standardCost: 32000, reorderLevel: 5, status: 'ACTIVE', currentStock: 15, availableStock: 10, createdAt: '2026-09-15T08:00:00', updatedAt: '2026-09-15T08:00:00' },
      { id: 2, tenantId: 1, name: 'Control Panel CP-100', sku: 'FG-CTRL-100', description: 'Automated programmable logic control panel with IP65 enclosure', unitPrice: 32000, unit: 'UNIT', category: 'FINISHED_GOOD', taxRate: 18, standardCost: 22000, reorderLevel: 3, status: 'ACTIVE', currentStock: 8, availableStock: 6, createdAt: '2026-09-15T08:00:00', updatedAt: '2026-09-15T08:00:00' },
      { id: 3, tenantId: 1, name: 'High-Torque Electric Motor 5HP', sku: 'SA-MTR-05', description: '3-phase 415V 50Hz TEFC cast iron motor', unitPrice: 16000, unit: 'UNIT', category: 'SUB_ASSEMBLY', taxRate: 18, standardCost: 12500, reorderLevel: 8, status: 'ACTIVE', currentStock: 24, availableStock: 18, createdAt: '2026-09-15T08:00:00', updatedAt: '2026-09-15T08:00:00' },
      { id: 4, tenantId: 1, name: 'Cast Iron Pump Housing Shell', sku: 'RM-STL-HSG', description: 'Grade FG260 grey cast iron machined casting', unitPrice: 3500, unit: 'PCS', category: 'RAW_MATERIAL', taxRate: 18, standardCost: 2800, reorderLevel: 15, status: 'ACTIVE', currentStock: 30, availableStock: 20, createdAt: '2026-09-15T08:00:00', updatedAt: '2026-09-15T08:00:00' },
      { id: 5, tenantId: 1, name: 'Deep Groove Ball Bearing 6205', sku: 'RM-BRG-6205', description: 'High-speed chrome steel double sealed ball bearing', unitPrice: 600, unit: 'PCS', category: 'RAW_MATERIAL', taxRate: 18, standardCost: 450, reorderLevel: 20, status: 'ACTIVE', currentStock: 8, availableStock: 6, createdAt: '2026-09-15T08:00:00', updatedAt: '2026-09-15T08:00:00' },
      { id: 6, tenantId: 1, name: 'Stainless Hex Bolt M8x30', sku: 'RM-SCR-M8', description: 'Grade 304 stainless steel metric hex fastener bolt', unitPrice: 25, unit: 'PCS', category: 'RAW_MATERIAL', taxRate: 18, standardCost: 15, reorderLevel: 50, status: 'ACTIVE', currentStock: 120, availableStock: 80, createdAt: '2026-09-15T08:00:00', updatedAt: '2026-09-15T08:00:00' },

      // Tenant 2 (Hydraulic Actuators - INR)
      { id: 7, tenantId: 2, name: 'Heavy Hydraulic Actuator 200kN', sku: 'FG-ACT-200', description: 'High-performance linear double-acting hydraulic actuator', unitPrice: 185000, unit: 'UNIT', category: 'FINISHED_GOOD', taxRate: 18, standardCost: 120000, reorderLevel: 2, status: 'ACTIVE', currentStock: 6, availableStock: 4, createdAt: '2026-09-15T08:00:00', updatedAt: '2026-09-15T08:00:00' },
      { id: 8, tenantId: 2, name: 'Precision Chrome Cylinder Rod', sku: 'RM-CYL-10', description: 'Hard chrome plated induction hardened cylinder shaft', unitPrice: 38000, unit: 'PCS', category: 'RAW_MATERIAL', taxRate: 18, standardCost: 26000, reorderLevel: 5, status: 'ACTIVE', currentStock: 20, availableStock: 16, createdAt: '2026-09-15T08:00:00', updatedAt: '2026-09-15T08:00:00' },
      { id: 9, tenantId: 2, name: 'High-Pressure Hydraulic Seal Kit', sku: 'RM-SEAL-HP', description: 'Polyurethane dual wiper and rod pressure seal set', unitPrice: 8500, unit: 'PCS', category: 'RAW_MATERIAL', taxRate: 18, standardCost: 5500, reorderLevel: 10, status: 'ACTIVE', currentStock: 25, availableStock: 20, createdAt: '2026-09-15T08:00:00', updatedAt: '2026-09-15T08:00:00' }
    ];

    // 3. Inventory & Valuation
    this.allInventory = [
      { id: 1, tenantId: 1, productId: 1, productName: 'Industrial Pump X-500', productSku: 'FG-PUMP-500', productCategory: 'FINISHED_GOOD', unit: 'UNIT', quantity: 15, currentStock: 15, reservedQuantity: 5, availableQuantity: 10, unitPrice: 45000, movingAverageCost: 32000, reorderLevel: 5, location: 'Pune Central - Bay 1', status: 'IN_STOCK', lastUpdated: '2026-09-29T10:00:00' },
      { id: 2, tenantId: 1, productId: 2, productName: 'Control Panel CP-100', productSku: 'FG-CTRL-100', productCategory: 'FINISHED_GOOD', unit: 'UNIT', quantity: 8, currentStock: 8, reservedQuantity: 2, availableQuantity: 6, unitPrice: 32000, movingAverageCost: 22000, reorderLevel: 3, location: 'Pune Central - Bay 2', status: 'IN_STOCK', lastUpdated: '2026-09-29T10:00:00' },
      { id: 3, tenantId: 1, productId: 3, productName: 'High-Torque Electric Motor 5HP', productSku: 'SA-MTR-05', productCategory: 'SUB_ASSEMBLY', unit: 'UNIT', quantity: 24, currentStock: 24, reservedQuantity: 6, availableQuantity: 18, unitPrice: 16000, movingAverageCost: 12500, reorderLevel: 8, location: 'Shop Floor - Rack 3', status: 'IN_STOCK', lastUpdated: '2026-09-29T10:00:00' },
      { id: 4, tenantId: 1, productId: 4, productName: 'Cast Iron Pump Housing Shell', productSku: 'RM-STL-HSG', productCategory: 'RAW_MATERIAL', unit: 'PCS', quantity: 30, currentStock: 30, reservedQuantity: 10, availableQuantity: 20, unitPrice: 3500, movingAverageCost: 2800, reorderLevel: 15, location: 'Raw Stores - Bin 12', status: 'IN_STOCK', lastUpdated: '2026-09-29T10:00:00' },
      { id: 5, tenantId: 1, productId: 5, productName: 'Deep Groove Ball Bearing 6205', productSku: 'RM-BRG-6205', productCategory: 'RAW_MATERIAL', unit: 'PCS', quantity: 8, currentStock: 8, reservedQuantity: 2, availableQuantity: 6, unitPrice: 600, movingAverageCost: 450, reorderLevel: 20, location: 'Raw Stores - Bin 4', status: 'LOW_STOCK', lastUpdated: '2026-09-29T10:00:00' },
      { id: 6, tenantId: 1, productId: 6, productName: 'Stainless Hex Bolt M8x30', productSku: 'RM-SCR-M8', productCategory: 'RAW_MATERIAL', unit: 'PCS', quantity: 120, currentStock: 120, reservedQuantity: 40, availableQuantity: 80, unitPrice: 25, movingAverageCost: 15, reorderLevel: 50, location: 'Hardware Bin 5', status: 'IN_STOCK', lastUpdated: '2026-09-29T10:00:00' },

      // Tenant 2
      { id: 7, tenantId: 2, productId: 7, productName: 'Heavy Hydraulic Actuator 200kN', productSku: 'FG-ACT-200', productCategory: 'FINISHED_GOOD', unit: 'UNIT', quantity: 6, currentStock: 6, reservedQuantity: 2, availableQuantity: 4, unitPrice: 185000, movingAverageCost: 120000, reorderLevel: 2, location: 'Bengaluru DC - Bay 1', status: 'IN_STOCK', lastUpdated: '2026-09-29T10:00:00' },
      { id: 8, tenantId: 2, productId: 8, productName: 'Precision Chrome Cylinder Rod', productSku: 'RM-CYL-10', productCategory: 'RAW_MATERIAL', unit: 'PCS', quantity: 20, currentStock: 20, reservedQuantity: 4, availableQuantity: 16, unitPrice: 38000, movingAverageCost: 26000, reorderLevel: 5, location: 'Bengaluru DC - Bar Stores', status: 'IN_STOCK', lastUpdated: '2026-09-29T10:00:00' },
      { id: 9, tenantId: 2, productId: 9, productName: 'High-Pressure Hydraulic Seal Kit', productSku: 'RM-SEAL-HP', productCategory: 'RAW_MATERIAL', unit: 'PCS', quantity: 25, currentStock: 25, reservedQuantity: 5, availableQuantity: 20, unitPrice: 8500, movingAverageCost: 5500, reorderLevel: 10, location: 'Bengaluru DC - Clean Room', status: 'IN_STOCK', lastUpdated: '2026-09-29T10:00:00' }
    ];

    // 4. BOMs (3-Level Multi-Level)
    this.allBoms = [
      {
        id: 1,
        tenantId: 1,
        productId: 1,
        productName: 'Industrial Centrifugal Pump X-500',
        productSku: 'FG-PUMP-500',
        version: '1.0',
        description: 'Standard Production BOM for Pump X-500 with scrap allowances',
        status: 'ACTIVE',
        items: [
          { materialId: 3, materialName: 'High-Torque Electric Motor 5HP', materialSku: 'SA-MTR-05', quantityRequired: 1, scrapPercentage: 0, unit: 'UNIT', availableStock: 18 },
          { materialId: 4, materialName: 'Cast Iron Pump Housing Shell', materialSku: 'RM-STL-HSG', quantityRequired: 1, scrapPercentage: 2, unit: 'PCS', availableStock: 20 },
          { materialId: 5, materialName: 'Deep Groove Ball Bearing 6205', materialSku: 'RM-BRG-6205', quantityRequired: 2, scrapPercentage: 0, unit: 'PCS', availableStock: 6 },
          { materialId: 6, materialName: 'Stainless Hex Bolt M8x30', materialSku: 'RM-SCR-M8', quantityRequired: 8, scrapPercentage: 5, unit: 'PCS', availableStock: 80 }
        ],
        createdAt: '2026-09-16T10:00:00',
        updatedAt: '2026-09-16T10:00:00'
      },
      {
        id: 2,
        tenantId: 2,
        productId: 7,
        productName: 'Heavy Hydraulic Actuator 200kN',
        productSku: 'FG-ACT-200',
        version: '1.0',
        description: 'Standard Assembly BOM for 200kN Actuator',
        status: 'ACTIVE',
        items: [
          { materialId: 8, materialName: 'Precision Chrome Cylinder Rod', materialSku: 'RM-CYL-10', quantityRequired: 1, scrapPercentage: 1, unit: 'PCS', availableStock: 16 },
          { materialId: 9, materialName: 'High-Pressure Hydraulic Seal Kit', materialSku: 'RM-SEAL-HP', quantityRequired: 1, scrapPercentage: 0, unit: 'PCS', availableStock: 20 }
        ],
        createdAt: '2026-09-16T10:00:00',
        updatedAt: '2026-09-16T10:00:00'
      }
    ];

    // 5. Suppliers
    this.allSuppliers = [
      { id: 1, tenantId: 1, name: 'Bharat Electric Motors Ltd', contactPerson: 'Ramesh Sharma', email: 'supply@bharatmotors.in', phone: '+91 22 2500 1122', address: 'Kanjurmarg Industrial Area, Mumbai', rating: 4.9, leadTimeDays: 5, status: 'ACTIVE', totalPurchaseOrders: 2, createdAt: '2026-09-18T10:00:00', updatedAt: '2026-09-18T10:00:00' },
      { id: 2, tenantId: 1, name: 'Apex Fasteners & Bearings Ltd', contactPerson: 'Anita Deshmukh', email: 'orders@apexfasteners.com', phone: '+91 20 2712 3344', address: 'Bhosari MIDC, Pune', rating: 4.8, leadTimeDays: 3, status: 'ACTIVE', totalPurchaseOrders: 3, createdAt: '2026-09-18T10:00:00', updatedAt: '2026-09-18T10:00:00' },
      { id: 3, tenantId: 2, name: 'Allied Precision Components US', contactPerson: 'John Smith', email: 'sales@alliedprecision.us', phone: '+1 800 555 4433', address: 'Industrial Blvd, Cleveland, OH', rating: 4.95, leadTimeDays: 4, status: 'ACTIVE', totalPurchaseOrders: 1, createdAt: '2026-09-18T10:00:00', updatedAt: '2026-09-18T10:00:00' }
    ];

    // 6. Sales Orders
    this.allSalesOrders = [
      {
        id: 1,
        tenantId: 1,
        orderNumber: 'SO-1001',
        customerId: 1,
        customerName: 'ABC Manufacturing Pvt Ltd',
        customerEmail: 'procurement@abcmfg.com',
        orderDate: '2026-09-25T11:00:00',
        expectedDeliveryDate: '2026-10-10',
        status: 'IN_PROGRESS',
        subtotal: 225000,
        taxAmount: 40500,
        totalAmount: 265500,
        createdBy: 'Ayush Patel',
        associatedWorkOrderId: 1,
        associatedWorkOrderNumber: 'WO-1001',
        associatedInvoiceId: 2,
        associatedInvoiceNumber: 'INV-5002',
        items: [
          { id: 1, productId: 1, productName: 'Industrial Pump X-500', productSku: 'FG-PUMP-500', unit: 'UNIT', quantity: 5, unitPrice: 45000, totalPrice: 225000, availableStock: 10, hasBom: true }
        ],
        createdAt: '2026-09-25T11:00:00',
        updatedAt: '2026-09-25T11:00:00'
      },
      {
        id: 2,
        tenantId: 1,
        orderNumber: 'SO-1002',
        customerId: 2,
        customerName: 'Techno Industries',
        customerEmail: 'orders@technoind.com',
        orderDate: '2026-09-28T14:30:00',
        expectedDeliveryDate: '2026-10-15',
        status: 'APPROVED',
        subtotal: 128000,
        taxAmount: 23040,
        totalAmount: 151040,
        createdBy: 'Ayush Patel',
        associatedWorkOrderId: 2,
        associatedWorkOrderNumber: 'WO-1002',
        items: [
          { id: 2, productId: 2, productName: 'Control Panel CP-100', productSku: 'FG-CTRL-100', unit: 'UNIT', quantity: 4, unitPrice: 32000, totalPrice: 128000, availableStock: 6, hasBom: true }
        ],
        createdAt: '2026-09-28T14:30:00',
        updatedAt: '2026-09-28T14:30:00'
      },
      {
        id: 3,
        tenantId: 1,
        orderNumber: 'SO-1003',
        customerId: 1,
        customerName: 'ABC Manufacturing Pvt Ltd',
        customerEmail: 'procurement@abcmfg.com',
        orderDate: '2026-09-18T10:15:00',
        expectedDeliveryDate: '2026-09-28',
        status: 'COMPLETED',
        subtotal: 135000,
        taxAmount: 24300,
        totalAmount: 159300,
        createdBy: 'Ayush Patel',
        associatedWorkOrderId: 3,
        associatedWorkOrderNumber: 'WO-1000',
        associatedDeliveryNoteId: 1,
        associatedDeliveryNoteNumber: 'DN-4001',
        associatedInvoiceId: 1,
        associatedInvoiceNumber: 'INV-5001',
        items: [
          { id: 3, productId: 1, productName: 'Industrial Pump X-500', productSku: 'FG-PUMP-500', unit: 'UNIT', quantity: 3, unitPrice: 45000, totalPrice: 135000, availableStock: 10, hasBom: true }
        ],
        createdAt: '2026-09-18T10:15:00',
        updatedAt: '2026-09-28T16:00:00'
      },
      // Tenant 2 Sales Order (INR)
      {
        id: 4,
        tenantId: 2,
        orderNumber: 'Z-SO-101',
        customerId: 3,
        customerName: 'Midwest Turbine Systems India Pvt Ltd',
        customerEmail: 'orders@midwestturbine.co.in',
        orderDate: '2026-09-26T10:00:00',
        expectedDeliveryDate: '2026-10-12',
        status: 'IN_PROGRESS',
        subtotal: 740000,
        taxAmount: 133200,
        totalAmount: 873200,
        createdBy: 'Naveen Kumar',
        items: [
          { id: 4, productId: 7, productName: 'Heavy Hydraulic Actuator 200kN', productSku: 'FG-ACT-200', unit: 'UNIT', quantity: 4, unitPrice: 185000, totalPrice: 740000, availableStock: 4, hasBom: true }
        ],
        createdAt: '2026-09-26T10:00:00',
        updatedAt: '2026-09-26T10:00:00'
      }
    ];

    // 7. Work Orders
    this.allWorkOrders = [
      {
        id: 1,
        tenantId: 1,
        workOrderNumber: 'WO-1001',
        salesOrderId: 1,
        salesOrderNumber: 'SO-1001',
        customerName: 'ABC Manufacturing Pvt Ltd',
        productId: 1,
        productName: 'Industrial Pump X-500',
        productSku: 'FG-PUMP-500',
        quantity: 5,
        startDate: '2026-09-26',
        expectedEndDate: '2026-10-05',
        status: 'IN_PROGRESS',
        assignedTo: 'Vikram Rao',
        progressPercentage: 60,
        notes: 'Stage 2 Machining Complete; Winding and pressure testing underway',
        requiredMaterials: [
          { materialId: 3, materialName: 'High-Torque Electric Motor 5HP', materialSku: 'SA-MTR-05', unitRequirement: 1, totalRequired: 5, availableStock: 18, shortageQuantity: 0, isSufficient: true, unit: 'UNIT' },
          { materialId: 4, materialName: 'Cast Iron Pump Housing Shell', materialSku: 'RM-STL-HSG', unitRequirement: 1, totalRequired: 5, availableStock: 20, shortageQuantity: 0, isSufficient: true, unit: 'PCS' },
          { materialId: 5, materialName: 'Deep Groove Ball Bearing 6205', materialSku: 'RM-BRG-6205', unitRequirement: 2, totalRequired: 10, availableStock: 6, shortageQuantity: 4, isSufficient: false, unit: 'PCS' },
          { materialId: 6, materialName: 'Stainless Hex Bolt M8x30', materialSku: 'RM-SCR-M8', unitRequirement: 8, totalRequired: 40, availableStock: 80, shortageQuantity: 0, isSufficient: true, unit: 'PCS' }
        ],
        createdAt: '2026-09-25T12:00:00',
        updatedAt: '2026-09-29T15:30:00'
      },
      {
        id: 2,
        tenantId: 1,
        workOrderNumber: 'WO-1002',
        salesOrderId: 2,
        salesOrderNumber: 'SO-1002',
        customerName: 'Techno Industries',
        productId: 2,
        productName: 'Control Panel CP-100',
        productSku: 'FG-CTRL-100',
        quantity: 4,
        startDate: '2026-09-29',
        expectedEndDate: '2026-10-06',
        status: 'PLANNED',
        assignedTo: 'Vikram Rao',
        progressPercentage: 0,
        notes: 'Scheduled for Bay 2 wiring assembly',
        createdAt: '2026-09-28T15:00:00',
        updatedAt: '2026-09-28T15:00:00'
      }
    ];

    // 8. Purchase Orders & GRNs
    this.allPurchaseOrders = [
      {
        id: 1,
        tenantId: 1,
        purchaseOrderNumber: 'PO-2001',
        supplierId: 2,
        supplierName: 'Apex Fasteners & Bearings Ltd',
        orderDate: '2026-09-28',
        expectedDeliveryDate: '2026-10-03',
        status: 'ORDERED',
        totalAmount: 21240,
        createdBy: 'Sunita Joshi',
        approvedBy: 'Sunita Joshi',
        items: [
          { id: 1, materialId: 5, materialName: 'Deep Groove Ball Bearing 6205', materialSku: 'RM-BRG-6205', unit: 'PCS', quantity: 40, receivedQuantity: 0, unitPrice: 450, totalPrice: 18000 }
        ],
        createdAt: '2026-09-28T11:00:00',
        updatedAt: '2026-09-28T11:00:00'
      }
    ];

    this.allGoodsReceipts = [
      {
        id: 1,
        tenantId: 1,
        grnNumber: 'GRN-3001',
        purchaseOrderId: 1,
        purchaseOrderNumber: 'PO-2001',
        supplierId: 2,
        supplierName: 'Apex Fasteners & Bearings Ltd',
        receiptDate: '2026-09-30',
        deliveryChallanNo: 'DC-AFB-9988',
        status: 'COMPLETED',
        qcStatus: 'PASSED',
        receivedBy: 'Karan Varma',
        lines: [
          { productId: 5, productName: 'Deep Groove Ball Bearing 6205', productSku: 'RM-BRG-6205', qtyOrdered: 40, qtyReceived: 40, qtyAccepted: 40, qtyRejected: 0, unitCost: 450, batchId: 'LOT-BRG-02' }
        ],
        createdAt: '2026-09-30T14:00:00'
      }
    ];

    // 9. Delivery Notes (Module M8 Dispatch)
    this.allDeliveryNotes = [
      {
        id: 1,
        tenantId: 1,
        dnNumber: 'DN-4001',
        salesOrderId: 3,
        salesOrderNumber: 'SO-1003',
        customerId: 1,
        customerName: 'ABC Manufacturing Pvt Ltd',
        dispatchDate: '2026-09-28',
        transporterName: 'VRL Logistics Express',
        trackingNo: 'VRL-PUN-992211',
        status: 'DELIVERED',
        dispatchedBy: 'Karan Varma',
        lines: [
          { orderLineId: 3, productId: 1, productName: 'Industrial Pump X-500', productSku: 'FG-PUMP-500', qtyDispatched: 3, unit: 'UNIT' }
        ],
        createdAt: '2026-09-28T12:00:00'
      }
    ];

    // 10. Invoices & Credit Notes
    this.allInvoices = [
      {
        id: 1,
        tenantId: 1,
        invoiceNumber: 'INV-5001',
        salesOrderId: 3,
        salesOrderNumber: 'SO-1003',
        deliveryNoteId: 1,
        deliveryNoteNumber: 'DN-4001',
        customerId: 1,
        customerName: 'ABC Manufacturing Pvt Ltd',
        customerEmail: 'procurement@abcmfg.com',
        customerAddress: 'Plot 42, MIDC Industrial Area, Pune 411018',
        invoiceDate: '2026-09-28',
        dueDate: '2026-10-28',
        subtotal: 135000,
        tax: 24300,
        totalAmount: 159300,
        paidAmount: 159300,
        remainingAmount: 0,
        status: 'PAID',
        createdAt: '2026-09-28T16:00:00'
      },
      {
        id: 2,
        tenantId: 1,
        invoiceNumber: 'INV-5002',
        salesOrderId: 1,
        salesOrderNumber: 'SO-1001',
        customerId: 1,
        customerName: 'ABC Manufacturing Pvt Ltd',
        customerEmail: 'procurement@abcmfg.com',
        customerAddress: 'Plot 42, MIDC Industrial Area, Pune 411018',
        invoiceDate: '2026-09-29',
        dueDate: '2026-10-29',
        subtotal: 225000,
        tax: 40500,
        totalAmount: 265500,
        paidAmount: 100000,
        remainingAmount: 165500,
        status: 'PARTIALLY_PAID',
        createdAt: '2026-09-29T11:00:00'
      }
    ];

    // 11. Payments
    this.allPayments = [
      { id: 1, tenantId: 1, paymentReference: 'PAY-9001', invoiceId: 1, invoiceNumber: 'INV-5001', paymentDate: '2026-09-29T10:30:00', amount: 159300, paymentMethod: 'BANK_TRANSFER', transactionReference: 'NEFT-HDFC-99882233', status: 'COMPLETED', notes: 'Full settlement for SO-1003', recordedBy: 'Naveen Goyal', createdAt: '2026-09-29T10:30:00' },
      { id: 2, tenantId: 1, paymentReference: 'PAY-9002', invoiceId: 2, invoiceNumber: 'INV-5002', paymentDate: '2026-09-30T09:15:00', amount: 100000, paymentMethod: 'BANK_TRANSFER', transactionReference: 'RTGS-ICICI-44551122', status: 'COMPLETED', notes: 'Advance tranche payment for SO-1001', recordedBy: 'Naveen Goyal', createdAt: '2026-09-30T09:15:00' }
    ];

    // 12. Audit Logs & Notifications
    this.allAuditLogs = [
      { id: 1, tenantId: 1, username: 'admin@apex.com', action: 'TENANT_INITIALIZED', entityType: 'Tenant', entityId: 'APEX_MFG', newValue: 'Plan: ENTERPRISE, Multi-Tenant Setup', ipAddress: '192.168.1.1', timestamp: '2026-09-20T09:00:00' },
      { id: 2, tenantId: 1, username: 'sales@apex.com', action: 'ORDER_CREATED', entityType: 'SalesOrder', entityId: 'SO-1001', newValue: 'Status: DRAFT, Total: ₹265,500', ipAddress: '192.168.1.104', timestamp: '2026-09-25T11:00:00' },
      { id: 3, tenantId: 1, username: 'salesmgr@apex.com', action: 'ORDER_APPROVED', entityType: 'SalesOrder', entityId: 'SO-1001', oldValue: 'SUBMITTED', newValue: 'APPROVED', ipAddress: '192.168.1.105', timestamp: '2026-09-25T11:30:00' },
      { id: 4, tenantId: 1, username: 'planner@apex.com', action: 'WORK_ORDER_STARTED', entityType: 'WorkOrder', entityId: 'WO-1001', oldValue: 'PLANNED', newValue: 'IN_PROGRESS', ipAddress: '192.168.1.108', timestamp: '2026-09-26T09:00:00' },
      { id: 5, tenantId: 1, username: 'finance@apex.com', action: 'PAYMENT_RECORDED', entityType: 'Payment', entityId: 'PAY-9002', oldValue: 'Balance: ₹265,500', newValue: 'Paid: ₹100,000, Remaining: ₹165,500', ipAddress: '192.168.1.112', timestamp: '2026-09-30T09:15:00' },
      // Tenant 2 Log
      { id: 6, tenantId: 2, username: 'admin@zenith.com', action: 'TENANT_INITIALIZED', entityType: 'Tenant', entityId: 'ZENITH_IND', newValue: 'Plan: ENTERPRISE, Chicago Plant', ipAddress: '10.0.0.12', timestamp: '2026-09-24T08:00:00' }
    ];

    this.allNotifications = [
      { id: 1, tenantId: 1, title: 'Low Stock Alert: Deep Groove Ball Bearing 6205', message: 'Bearing 6205 is below reorder level (8 remaining, reorder threshold 20).', type: 'WARNING', targetRole: 'PROCUREMENT_OFFICER', isRead: false, createdAt: '2026-09-29T08:00:00' },
      { id: 2, tenantId: 1, title: 'Sales Order Approved: SO-1002', message: 'Order SO-1002 approved by Meera Deshmukh (Sales Manager).', type: 'SUCCESS', targetRole: 'PRODUCTION_PLANNER', isRead: false, createdAt: '2026-09-28T14:35:00' }
    ];

    this.allUsers = [
      { id: 1, tenantId: 1, name: 'Rajesh Sharma', email: 'admin@apex.com', roles: ['TENANT_ADMIN'], isActive: true, createdAt: '2026-09-01T00:00:00' },
      { id: 2, tenantId: 1, name: 'Ayush Patel', email: 'sales@apex.com', roles: ['SALES_EXECUTIVE'], isActive: true, createdAt: '2026-09-01T00:00:00' },
      { id: 3, tenantId: 1, name: 'Meera Deshmukh', email: 'salesmgr@apex.com', roles: ['SALES_MANAGER'], isActive: true, createdAt: '2026-09-01T00:00:00' },
      { id: 4, tenantId: 1, name: 'Vikram Rao', email: 'planner@apex.com', roles: ['PRODUCTION_PLANNER'], isActive: true, createdAt: '2026-09-01T00:00:00' },
      { id: 5, tenantId: 1, name: 'Sunita Joshi', email: 'procurement@apex.com', roles: ['PROCUREMENT_OFFICER'], isActive: true, createdAt: '2026-09-01T00:00:00' },
      { id: 6, tenantId: 1, name: 'Karan Varma', email: 'store@apex.com', roles: ['STORE_KEEPER'], isActive: true, createdAt: '2026-09-01T00:00:00' },
      { id: 7, tenantId: 1, name: 'Naveen Goyal', email: 'finance@apex.com', roles: ['FINANCE_USER'], isActive: true, createdAt: '2026-09-01T00:00:00' },
      { id: 8, tenantId: 2, name: 'Sarah Jenkins', email: 'admin@zenith.com', roles: ['TENANT_ADMIN'], isActive: true, createdAt: '2026-09-01T00:00:00' },
      { id: 9, tenantId: 2, name: 'David Miller', email: 'sales@zenith.com', roles: ['SALES_EXECUTIVE'], isActive: true, createdAt: '2026-09-01T00:00:00' }
    ];

    // Initial broadcast
    this.publishTenantData(this.activeTenantId);
  }

  // ==================== AUDIT & NOTIFICATIONS ====================
  public logAudit(action: string, entityType: string, entityId: string, oldValue?: string, newValue?: string): void {
    const user = this.authService.currentUserValue;
    const item: AuditLogItem = {
      id: this.allAuditLogs.length + 1,
      tenantId: this.activeTenantId,
      username: user ? user.email : 'system@ordercraft.com',
      action,
      entityType,
      entityId,
      oldValue,
      newValue,
      ipAddress: '192.168.1.100',
      timestamp: new Date().toISOString()
    };
    this.allAuditLogs.unshift(item);
    this.publishTenantData(this.activeTenantId);
  }

  public addNotification(title: string, message: string, type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ALERT', targetRole?: string): void {
    const item: NotificationItem = {
      id: this.allNotifications.length + 1,
      tenantId: this.activeTenantId,
      title,
      message,
      type,
      targetRole,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    this.allNotifications.unshift(item);
    this.publishTenantData(this.activeTenantId);
  }

  public markNotificationAsRead(id: number): void {
    const notif = this.allNotifications.find(n => n.id === id);
    if (notif) notif.isRead = true;
    this.publishTenantData(this.activeTenantId);
  }

  // ==================== M2: MASTER DATA ====================
  public addCustomer(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Customer {
    const newCust: Customer = {
      ...customerData,
      id: this.allCustomers.length + 1,
      tenantId: this.activeTenantId,
      totalOrdersCount: 0,
      openReceivables: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.allCustomers.unshift(newCust);
    this.logAudit('CUSTOMER_CREATED', 'Customer', newCust.code || newCust.id.toString(), undefined, newCust.name);
    this.publishTenantData(this.activeTenantId);
    this.toast.success(`Customer ${newCust.name} created successfully.`);
    return newCust;
  }

  public addProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
    const newProd: Product = {
      ...productData,
      id: this.allProducts.length + 1,
      tenantId: this.activeTenantId,
      currentStock: 0,
      availableStock: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.allProducts.unshift(newProd);

    // Create corresponding stock balance
    this.allInventory.push({
      id: this.allInventory.length + 1,
      tenantId: this.activeTenantId,
      productId: newProd.id,
      productName: newProd.name,
      productSku: newProd.sku,
      productCategory: newProd.category,
      unit: newProd.unit,
      quantity: 0,
      currentStock: 0,
      reservedQuantity: 0,
      availableQuantity: 0,
      reorderLevel: newProd.reorderLevel || 5,
      unitPrice: newProd.unitPrice,
      movingAverageCost: newProd.standardCost || newProd.unitPrice * 0.7,
      location: 'Warehouse Central',
      status: 'OUT_OF_STOCK',
      lastUpdated: new Date().toISOString()
    });

    this.logAudit('PRODUCT_CREATED', 'Product', newProd.sku, undefined, newProd.name);
    this.publishTenantData(this.activeTenantId);
    this.toast.success(`Product ${newProd.name} added to catalog.`);
    return newProd;
  }

  public addSupplier(supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Supplier {
    const newSupp: Supplier = {
      ...supplierData,
      id: this.allSuppliers.length + 1,
      tenantId: this.activeTenantId,
      totalPurchaseOrders: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.allSuppliers.unshift(newSupp);
    this.logAudit('SUPPLIER_CREATED', 'Supplier', newSupp.id.toString(), undefined, newSupp.name);
    this.publishTenantData(this.activeTenantId);
    this.toast.success(`Supplier ${newSupp.name} onboarded.`);
    return newSupp;
  }

  // ==================== M3: BOM & EXPLOSION WITH SCRAP % ====================
  public explodeBom(productId: number, targetQty: number): BomExplosionItem[] {
    const bom = this.allBoms.find(b => b.tenantId === this.activeTenantId && b.productId === productId && b.status === 'ACTIVE');
    if (!bom) return [];

    return bom.items.map(item => {
      const scrapFactor = 1 + ((item.scrapPercentage || 0) / 100);
      const totalRequired = Math.ceil(item.quantityRequired * targetQty * scrapFactor);
      const inv = this.allInventory.find(i => i.tenantId === this.activeTenantId && i.productId === item.materialId);
      const available = inv ? inv.availableQuantity : 0;
      const shortage = Math.max(0, totalRequired - available);

      return {
        materialId: item.materialId,
        materialName: item.materialName || 'Component',
        materialSku: item.materialSku || 'SKU',
        unitRequirement: item.quantityRequired,
        scrapPercentage: item.scrapPercentage || 0,
        totalRequired,
        availableStock: available,
        shortageQuantity: shortage,
        isSufficient: shortage === 0,
        unit: item.unit
      };
    });
  }

  public calculateBomRequirements(productId: number, targetQty: number): BomExplosionItem[] {
    return this.explodeBom(productId, targetQty);
  }

  public cancelSalesOrder(orderId: number): void {
    const order = this.allSalesOrders.find(o => o.id === orderId && o.tenantId === this.activeTenantId);
    if (order) {
      order.status = 'CANCELLED';
      this.logAudit('ORDER_CANCELLED', 'SalesOrder', order.orderNumber);
      this.publishTenantData(this.activeTenantId);
      this.toast.info(`Order ${order.orderNumber} cancelled.`);
    }
  }

  // ==================== M4: SALES ORDERS & APPROVALS ====================
  public createSalesOrder(orderData: { customerId: number; expectedDeliveryDate: string; items: { productId: number; quantity: number }[] }): SalesOrder {
    const customer = this.allCustomers.find(c => c.id === orderData.customerId);
    if (!customer) throw new Error('Customer not found');

    const orderLines: SalesOrderItem[] = [];
    let subtotal = 0;

    orderData.items.forEach((it, idx) => {
      const prod = this.allProducts.find(p => p.id === it.productId);
      if (prod) {
        const lineTotal = prod.unitPrice * it.quantity;
        subtotal += lineTotal;
        const inv = this.allInventory.find(i => i.productId === prod.id);
        orderLines.push({
          id: idx + 1,
          productId: prod.id,
          productName: prod.name,
          productSku: prod.sku,
          unit: prod.unit,
          quantity: it.quantity,
          unitPrice: prod.unitPrice,
          totalPrice: lineTotal,
          availableStock: inv ? inv.availableQuantity : 0,
          hasBom: this.allBoms.some(b => b.productId === prod.id && b.status === 'ACTIVE')
        });
      }
    });

    const taxAmount = Math.round(subtotal * 0.18 * 100) / 100;
    const totalAmount = subtotal + taxAmount;

    // Credit limit and approval checks (M4)
    const tenant = this.authService.currentTenantValue;
    const threshold = tenant.settings.approvalThreshold;
    const needsApproval = totalAmount > threshold;
    const creditExceeded = (customer.openReceivables || 0) + totalAmount > customer.creditLimit;

    const tenantPrefix = tenant.code === 'ZENITH_IND' ? 'Z-SO-' : 'SO-';
    const orderNo = tenantPrefix + (1000 + this.allSalesOrders.filter(o => o.tenantId === this.activeTenantId).length + 1);

    const newOrder: SalesOrder = {
      id: this.allSalesOrders.length + 1,
      tenantId: this.activeTenantId,
      orderNumber: orderNo,
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      orderDate: new Date().toISOString(),
      expectedDeliveryDate: orderData.expectedDeliveryDate,
      status: needsApproval ? 'APPROVAL_PENDING' : 'DRAFT',
      requiresApproval: needsApproval,
      approvalReason: needsApproval ? `Order value (${tenant.currencySymbol}${totalAmount.toLocaleString()}) exceeds threshold (${tenant.currencySymbol}${threshold.toLocaleString()})` : undefined,
      subtotal,
      taxAmount,
      totalAmount,
      revisionNo: 1,
      createdBy: this.authService.currentUserValue?.name || 'Sales Executive',
      items: orderLines,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.allSalesOrders.unshift(newOrder);
    this.logAudit('ORDER_CREATED', 'SalesOrder', newOrder.orderNumber, undefined, `Total: ${tenant.currencySymbol}${totalAmount}`);

    if (creditExceeded) {
      this.toast.warning(`Notice: Order exceeds Customer credit limit (${tenant.currencySymbol}${customer.creditLimit.toLocaleString()}).`);
    } else {
      this.toast.success(`Sales Order ${newOrder.orderNumber} created.`);
    }

    this.publishTenantData(this.activeTenantId);
    return newOrder;
  }

  public approveSalesOrder(orderId: number): void {
    const order = this.allSalesOrders.find(o => o.id === orderId && o.tenantId === this.activeTenantId);
    if (!order) throw new Error('Order not found');

    order.status = 'APPROVED';
    order.approvedBy = this.authService.currentUserValue?.name || 'Sales Manager';
    order.updatedAt = new Date().toISOString();

    this.logAudit('ORDER_APPROVED', 'SalesOrder', order.orderNumber, 'APPROVAL_PENDING', 'APPROVED');
    this.toast.success(`Sales Order ${order.orderNumber} approved by manager.`);
    this.publishTenantData(this.activeTenantId);
  }

  public confirmSalesOrder(orderId: number): SalesOrder {
    const order = this.allSalesOrders.find(o => o.id === orderId && o.tenantId === this.activeTenantId);
    if (!order) throw new Error('Order not found');

    order.status = 'CONFIRMED';
    order.updatedAt = new Date().toISOString();

    // Reserve finished goods stock if available
    order.items.forEach(item => {
      const inv = this.allInventory.find(i => i.productId === item.productId && i.tenantId === this.activeTenantId);
      if (inv) {
        const reserveQty = Math.min(item.quantity, inv.availableQuantity);
        inv.reservedQuantity += reserveQty;
        inv.availableQuantity = Math.max(0, inv.quantity - inv.reservedQuantity);
        this.recordTransaction(item.productId, 'RESERVE', reserveQty, `Order Reservation ${order.orderNumber}`);
      }
    });

    // Auto-create Work Order for primary FG line
    const fgItem = order.items.find(it => it.hasBom) || order.items[0];
    if (fgItem) {
      const woPrefix = this.activeTenantId === 2 ? 'Z-WO-' : 'WO-';
      const woNum = woPrefix + (1000 + this.allWorkOrders.filter(w => w.tenantId === this.activeTenantId).length + 1);
      const newWo: WorkOrder = {
        id: this.allWorkOrders.length + 1,
        tenantId: this.activeTenantId,
        workOrderNumber: woNum,
        salesOrderId: order.id,
        salesOrderNumber: order.orderNumber,
        customerName: order.customerName,
        productId: fgItem.productId,
        productName: fgItem.productName || 'Finished Good',
        productSku: fgItem.productSku || 'FG-SKU',
        quantity: fgItem.quantity,
        startDate: new Date().toISOString().slice(0, 10),
        expectedEndDate: order.expectedDeliveryDate,
        status: 'PLANNED',
        assignedTo: 'Plant Lead',
        progressPercentage: 0,
        notes: `Production triggered for ${order.orderNumber}`,
        requiredMaterials: this.explodeBom(fgItem.productId, fgItem.quantity),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.allWorkOrders.unshift(newWo);
      order.associatedWorkOrderId = newWo.id;
      order.associatedWorkOrderNumber = newWo.workOrderNumber;
      order.status = 'IN_PROGRESS';
    }

    this.logAudit('ORDER_CONFIRMED', 'SalesOrder', order.orderNumber, 'APPROVED', order.status);
    this.toast.success(`Order ${order.orderNumber} confirmed & Work Order ${order.associatedWorkOrderNumber} created.`);
    this.publishTenantData(this.activeTenantId);
    return order;
  }

  // ==================== M5: INVENTORY MOVEMENTS ====================
  public recordTransaction(productId: number, type: InventoryTransaction['transactionType'], qty: number, notes?: string): void {
    const prod = this.allProducts.find(p => p.id === productId);
    const inv = this.allInventory.find(i => i.productId === productId && i.tenantId === this.activeTenantId);

    const prevQty = inv ? inv.quantity : 0;
    const newQty = (type === 'RECEIPT' || type === 'RECEIVED') ? prevQty + qty : (type === 'CONSUMED' || type === 'DISPATCH') ? prevQty - qty : prevQty;

    const txn: InventoryTransaction = {
      id: this.allTransactions.length + 1,
      tenantId: this.activeTenantId,
      productId,
      productName: prod ? prod.name : 'Product',
      productSku: prod ? prod.sku : 'SKU',
      transactionType: type,
      quantity: qty,
      previousQuantity: prevQty,
      newQuantity: newQty,
      notes,
      performedBy: this.authService.currentUserValue?.name || 'Store Keeper',
      createdAt: new Date().toISOString()
    };
    this.allTransactions.unshift(txn);
  }

  public adjustInventory(productId: number, adjustmentQty: number, reason: string): void {
    const inv = this.allInventory.find(i => i.productId === productId && i.tenantId === this.activeTenantId);
    if (!inv) throw new Error('Inventory record not found');

    const previous = inv.quantity;
    inv.quantity = Math.max(0, inv.quantity + adjustmentQty);
    inv.availableQuantity = Math.max(0, inv.quantity - inv.reservedQuantity);
    inv.status = inv.availableQuantity === 0 ? 'OUT_OF_STOCK' : inv.availableQuantity <= inv.reorderLevel ? 'LOW_STOCK' : 'IN_STOCK';
    inv.lastUpdated = new Date().toISOString();

    this.recordTransaction(productId, 'ADJUSTED', adjustmentQty, reason);
    this.logAudit('INVENTORY_ADJUSTED', 'Inventory', inv.productSku, `Prev: ${previous}`, `New: ${inv.quantity}`);
    this.publishTenantData(this.activeTenantId);
    this.toast.success(`Inventory updated for ${inv.productName}.`);
  }

  // ==================== M6: PROCUREMENT & 3-WAY MATCHING ====================
  public createPurchaseOrder(poData: { supplierId: number; expectedDeliveryDate: string; items: { materialId: number; quantity: number; unitPrice: number }[] }): PurchaseOrder {
    const supplier = this.allSuppliers.find(s => s.id === poData.supplierId);
    if (!supplier) throw new Error('Supplier not found');

    const prefix = this.activeTenantId === 2 ? 'Z-PO-' : 'PO-';
    const poNum = prefix + (2000 + this.allPurchaseOrders.filter(p => p.tenantId === this.activeTenantId).length + 1);

    const poItems: PurchaseOrderItem[] = poData.items.map((it, idx) => {
      const prod = this.allProducts.find(p => p.id === it.materialId);
      return {
        id: idx + 1,
        materialId: it.materialId,
        materialName: prod?.name || 'Material',
        materialSku: prod?.sku || 'SKU',
        unit: prod?.unit || 'PCS',
        quantity: it.quantity,
        receivedQuantity: 0,
        unitPrice: it.unitPrice,
        totalPrice: it.quantity * it.unitPrice
      };
    });

    const totalAmount = poItems.reduce((sum, i) => sum + (i.totalPrice || 0), 0);

    const newPo: PurchaseOrder = {
      id: this.allPurchaseOrders.length + 1,
      tenantId: this.activeTenantId,
      purchaseOrderNumber: poNum,
      supplierId: supplier.id,
      supplierName: supplier.name,
      orderDate: new Date().toISOString().slice(0, 10),
      expectedDeliveryDate: poData.expectedDeliveryDate,
      status: 'APPROVED',
      totalAmount,
      createdBy: this.authService.currentUserValue?.name || 'Procurement Officer',
      items: poItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.allPurchaseOrders.unshift(newPo);
    this.logAudit('PO_CREATED', 'PurchaseOrder', newPo.purchaseOrderNumber, undefined, `Total: ${newPo.totalAmount}`);
    this.toast.success(`Purchase Order ${newPo.purchaseOrderNumber} issued to ${supplier.name}.`);
    this.publishTenantData(this.activeTenantId);
    return newPo;
  }

  public createPoFromShortages(shortageItems: BomExplosionItem[]): PurchaseOrder {
    const deficits = shortageItems.filter(s => s.shortageQuantity > 0);
    if (deficits.length === 0) {
      this.toast.info('No material deficits found. All components sufficient.');
      throw new Error('No shortages to procure');
    }

    const suppliers = this.allSuppliers.filter(s => s.tenantId === this.activeTenantId);
    const supplier = suppliers[0] || this.allSuppliers[0];
    if (!supplier) throw new Error('No supplier configured');

    const poItems = deficits.map(d => {
      const prod = this.allProducts.find(p => p.id === d.materialId);
      const unitPrice = prod?.unitPrice || 450;
      return {
        materialId: d.materialId,
        quantity: d.shortageQuantity,
        unitPrice: unitPrice
      };
    });

    const expectedDate = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    const po = this.createPurchaseOrder({
      supplierId: supplier.id,
      expectedDeliveryDate: expectedDate,
      items: poItems
    });

    this.toast.success(`Procurement requisition generated: ${po.purchaseOrderNumber} for ${deficits.length} deficit items.`);
    return po;
  }

  public searchGlobal(query: string): { type: string; title: string; subtitle: string; route: string; badge: string }[] {
    if (!query || query.trim().length < 2) return [];
    const q = query.toLowerCase().trim();
    const results: { type: string; title: string; subtitle: string; route: string; badge: string }[] = [];

    // Orders
    this.salesOrdersSub.value.forEach(o => {
      if (o.orderNumber.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q)) {
        results.push({
          type: 'ORDER',
          title: `${o.orderNumber} - ${o.customerName}`,
          subtitle: `Total: ${this.authService.currencySymbol}${o.totalAmount} • Status: ${o.status}`,
          route: '/orders',
          badge: o.status
        });
      }
    });

    // Products
    this.productsSub.value.forEach(p => {
      if (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)) {
        results.push({
          type: 'PRODUCT',
          title: `${p.name} (${p.sku})`,
          subtitle: `Price: ${this.authService.currencySymbol}${p.unitPrice} • Available: ${p.availableStock || 0} ${p.unit}`,
          route: '/products',
          badge: p.category
        });
      }
    });

    // Customers
    this.customersSub.value.forEach(c => {
      if (c.name.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.city?.toLowerCase().includes(q)) {
        results.push({
          type: 'CUSTOMER',
          title: c.name,
          subtitle: `${c.city || ''} • Open AR: ${this.authService.currencySymbol}${c.openReceivables || 0}`,
          route: '/customers',
          badge: c.status
        });
      }
    });

    // Work Orders
    this.workOrdersSub.value.forEach(w => {
      if (w.workOrderNumber.toLowerCase().includes(q) || w.productName.toLowerCase().includes(q)) {
        results.push({
          type: 'WORK_ORDER',
          title: `${w.workOrderNumber} - ${w.productName}`,
          subtitle: `Progress: ${w.progressPercentage}% • Status: ${w.status}`,
          route: '/work-orders',
          badge: w.status
        });
      }
    });

    return results.slice(0, 8);
  }

  public createGoodsReceipt(poId: number, deliveryChallanNo: string): GoodsReceipt {
    const po = this.allPurchaseOrders.find(p => p.id === poId && p.tenantId === this.activeTenantId);
    if (!po) throw new Error('Purchase order not found');

    const prefix = this.activeTenantId === 2 ? 'Z-GRN-' : 'GRN-';
    const grnNo = prefix + (3000 + this.allGoodsReceipts.filter(g => g.tenantId === this.activeTenantId).length + 1);

    const grnLines: GoodsReceiptLine[] = po.items.map((it, idx) => {
      // Increment actual inventory
      const inv = this.allInventory.find(i => i.productId === it.materialId && i.tenantId === this.activeTenantId);
      if (inv) {
        // Recalculate Moving Average Cost (MAC)
        const oldVal = inv.quantity * (inv.movingAverageCost || inv.unitPrice || 0);
        const addedVal = it.quantity * it.unitPrice;
        inv.quantity += it.quantity;
        inv.currentStock = inv.quantity;
        inv.availableQuantity += it.quantity;
        inv.movingAverageCost = Math.round((oldVal + addedVal) / inv.quantity);
        inv.status = inv.availableQuantity > inv.reorderLevel ? 'IN_STOCK' : 'LOW_STOCK';
      }
      this.recordTransaction(it.materialId, 'RECEIPT', it.quantity, `GRN Receipt ${grnNo}`);

      it.receivedQuantity = it.quantity;

      return {
        id: idx + 1,
        productId: it.materialId,
        productName: it.materialName || 'Material',
        productSku: it.materialSku || 'SKU',
        qtyOrdered: it.quantity,
        qtyReceived: it.quantity,
        qtyAccepted: it.quantity,
        qtyRejected: 0,
        unitCost: it.unitPrice
      };
    });

    po.status = 'RECEIVED';

    const newGrn: GoodsReceipt = {
      id: this.allGoodsReceipts.length + 1,
      tenantId: this.activeTenantId,
      grnNumber: grnNo,
      purchaseOrderId: po.id,
      purchaseOrderNumber: po.purchaseOrderNumber,
      supplierId: po.supplierId,
      supplierName: po.supplierName,
      receiptDate: new Date().toISOString().slice(0, 10),
      deliveryChallanNo,
      status: 'COMPLETED',
      qcStatus: 'PASSED',
      receivedBy: this.authService.currentUserValue?.name || 'Store Keeper',
      lines: grnLines,
      createdAt: new Date().toISOString()
    };

    this.allGoodsReceipts.unshift(newGrn);
    this.logAudit('GRN_RECEIVED', 'GoodsReceipt', newGrn.grnNumber, undefined, `PO: ${po.purchaseOrderNumber}`);
    this.toast.success(`Consignment received under ${newGrn.grnNumber}. Inventory updated.`);
    this.publishTenantData(this.activeTenantId);
    return newGrn;
  }

  public submitPurchaseOrder(id: number): void {
    const po = this.allPurchaseOrders.find(p => p.id === id && p.tenantId === this.activeTenantId);
    if (po) {
      po.status = 'PENDING_APPROVAL';
      this.logAudit('PO_SUBMITTED', 'PurchaseOrder', po.purchaseOrderNumber);
      this.publishTenantData(this.activeTenantId);
      this.toast.info(`Purchase Order ${po.purchaseOrderNumber} submitted for approval.`);
    }
  }

  public approvePurchaseOrder(id: number): void {
    const po = this.allPurchaseOrders.find(p => p.id === id && p.tenantId === this.activeTenantId);
    if (po) {
      po.status = 'APPROVED';
      po.approvedBy = this.authService.currentUserValue?.name || 'Procurement Lead';
      this.logAudit('PO_APPROVED', 'PurchaseOrder', po.purchaseOrderNumber);
      this.publishTenantData(this.activeTenantId);
      this.toast.success(`Purchase Order ${po.purchaseOrderNumber} approved.`);
    }
  }

  public receivePurchaseOrderMaterials(poId: number, payload?: any): GoodsReceipt {
    return this.createGoodsReceipt(poId, payload?.deliveryChallanNo || 'DC-AUTO');
  }

  public getThreeWayMatchRecords(): ThreeWayMatchRecord[] {
    const pos = this.allPurchaseOrders.filter(p => p.tenantId === this.activeTenantId);
    return pos.map(po => {
      const grn = this.allGoodsReceipts.find(g => g.purchaseOrderId === po.id);
      const grnVal = grn ? grn.lines.reduce((sum, l) => sum + (l.qtyAccepted * l.unitCost), 0) : 0;
      const invTotal = po.status === 'RECEIVED' ? po.totalAmount : 0;
      const variance = Math.abs(po.totalAmount - (grnVal || 0));

      return {
        poId: po.id,
        poNumber: po.purchaseOrderNumber,
        supplierName: po.supplierName,
        poTotal: po.totalAmount,
        grnNumber: grn ? grn.grnNumber : 'Pending GRN',
        grnAcceptedValue: grnVal,
        invoiceNumber: grn ? `V-INV-${po.id}` : 'Pending',
        invoiceTotal: invTotal,
        varianceAmount: variance,
        status: grn ? (variance === 0 ? 'MATCHED' : 'DISCREPANCY') : 'PENDING_GRN',
        toleranceExceeded: variance > po.totalAmount * 0.01 // 1% tolerance
      };
    });
  }

  // ==================== M7: SHOP FLOOR & PRODUCTION ====================
  public createWorkOrder(dto: {
    productId: number;
    quantity: number;
    assignedTo?: string;
    expectedEndDate?: string;
    notes?: string;
    salesOrderId?: number;
    salesOrderNumber?: string;
    customerName?: string;
  }): WorkOrder {
    const product = this.allProducts.find(p => p.id === dto.productId && p.tenantId === this.activeTenantId);
    if (!product) throw new Error('Product not found');

    const woPrefix = this.activeTenantId === 2 ? 'Z-WO-' : 'WO-';
    const woNum = woPrefix + (1000 + this.allWorkOrders.filter(w => w.tenantId === this.activeTenantId).length + 1);

    const newWo: WorkOrder = {
      id: this.allWorkOrders.length + 1,
      tenantId: this.activeTenantId,
      workOrderNumber: woNum,
      salesOrderId: dto.salesOrderId,
      salesOrderNumber: dto.salesOrderNumber || 'Direct Production Run',
      customerName: dto.customerName || 'Internal Stock Replenishment',
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      quantity: dto.quantity,
      startDate: new Date().toISOString().slice(0, 10),
      expectedEndDate: dto.expectedEndDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      status: 'PLANNED',
      assignedTo: dto.assignedTo || 'Plant Lead',
      progressPercentage: 0,
      notes: dto.notes || `Production batch scheduled for ${product.name}`,
      requiredMaterials: this.explodeBom(product.id, dto.quantity),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.allWorkOrders.unshift(newWo);
    this.logAudit('WORK_ORDER_CREATED', 'WorkOrder', newWo.workOrderNumber, undefined, `Qty: ${dto.quantity} of ${product.name}`);
    this.toast.success(`Work Order ${newWo.workOrderNumber} scheduled successfully.`);
    this.publishTenantData(this.activeTenantId);
    return newWo;
  }

  public advanceWorkOrderProgress(woId: number, progressPct: number): void {
    const wo = this.allWorkOrders.find(w => w.id === woId && w.tenantId === this.activeTenantId);
    if (!wo) throw new Error('Work order not found');

    wo.progressPercentage = progressPct;
    if (progressPct > 0 && wo.status === 'PLANNED') wo.status = 'IN_PROGRESS';

    this.logAudit('WO_PROGRESS_UPDATED', 'WorkOrder', wo.workOrderNumber, undefined, `${progressPct}%`);
    this.publishTenantData(this.activeTenantId);
  }

  public startWorkOrder(woId: number): void {
    this.advanceWorkOrderProgress(woId, 15);
    this.toast.info('Work order started.');
  }

  public pauseWorkOrder(woId: number): void {
    const wo = this.allWorkOrders.find(w => w.id === woId && w.tenantId === this.activeTenantId);
    if (wo) {
      wo.status = 'ON_HOLD';
      this.logAudit('WO_PAUSED', 'WorkOrder', wo.workOrderNumber);
      this.publishTenantData(this.activeTenantId);
      this.toast.warning(`Work Order ${wo.workOrderNumber} paused.`);
    }
  }

  public resumeWorkOrder(woId: number): void {
    const wo = this.allWorkOrders.find(w => w.id === woId && w.tenantId === this.activeTenantId);
    if (wo) {
      wo.status = 'IN_PROGRESS';
      this.logAudit('WO_RESUMED', 'WorkOrder', wo.workOrderNumber);
      this.publishTenantData(this.activeTenantId);
      this.toast.info(`Work Order ${wo.workOrderNumber} resumed.`);
    }
  }

  public updateWorkOrderProgress(woId: number, percentage: number): void {
    this.advanceWorkOrderProgress(woId, percentage);
  }

  public consumeWorkOrderMaterials(woId: number): void {
    const wo = this.allWorkOrders.find(w => w.id === woId && w.tenantId === this.activeTenantId);
    if (!wo || !wo.requiredMaterials) throw new Error('Work order has no BOM explosion');

    wo.requiredMaterials.forEach(mat => {
      const inv = this.allInventory.find(i => i.productId === mat.materialId && i.tenantId === this.activeTenantId);
      if (inv) {
        inv.quantity = Math.max(0, inv.quantity - mat.totalRequired);
        inv.currentStock = inv.quantity;
        inv.reservedQuantity = Math.max(0, inv.reservedQuantity - mat.totalRequired);
        inv.availableQuantity = Math.max(0, inv.quantity - inv.reservedQuantity);
        inv.status = inv.availableQuantity === 0 ? 'OUT_OF_STOCK' : inv.availableQuantity <= inv.reorderLevel ? 'LOW_STOCK' : 'IN_STOCK';
        this.recordTransaction(mat.materialId, 'CONSUMED', mat.totalRequired, `Material Consumption for ${wo.workOrderNumber}`);
      }
    });

    this.logAudit('MATERIAL_CONSUMED', 'WorkOrder', wo.workOrderNumber, undefined, 'BOM materials deducted');
    this.toast.success(`Materials consumed from inventory for ${wo.workOrderNumber}.`);
    this.publishTenantData(this.activeTenantId);
  }

  public completeWorkOrder(woId: number): void {
    const wo = this.allWorkOrders.find(w => w.id === woId && w.tenantId === this.activeTenantId);
    if (!wo) throw new Error('Work order not found');

    wo.status = 'COMPLETED';
    wo.progressPercentage = 100;
    wo.actualEndDate = new Date().toISOString().slice(0, 10);

    // Increase Finished Goods stock
    const inv = this.allInventory.find(i => i.productId === wo.productId && i.tenantId === this.activeTenantId);
    if (inv) {
      inv.quantity += wo.quantity;
      inv.currentStock = inv.quantity;
      inv.availableQuantity += wo.quantity;
      inv.status = 'IN_STOCK';
      this.recordTransaction(wo.productId, 'RECEIPT', wo.quantity, `FG Production Complete ${wo.workOrderNumber}`);
    }

    // Advance Sales Order
    if (wo.salesOrderId) {
      const so = this.allSalesOrders.find(s => s.id === wo.salesOrderId);
      if (so) so.status = 'READY_TO_SHIP';
    }

    this.logAudit('WORK_ORDER_COMPLETED', 'WorkOrder', wo.workOrderNumber, 'IN_PROGRESS', 'COMPLETED');
    this.toast.success(`Production completed for ${wo.workOrderNumber}. Finished goods ready for dispatch.`);
    this.publishTenantData(this.activeTenantId);
  }

  // ==================== M8: DISPATCH & DELIVERY NOTES ====================
  public createDeliveryNote(salesOrderId: number, transporterName: string, trackingNo: string): DeliveryNote {
    const order = this.allSalesOrders.find(o => o.id === salesOrderId && o.tenantId === this.activeTenantId);
    if (!order) throw new Error('Sales order not found');

    const prefix = this.activeTenantId === 2 ? 'Z-DN-' : 'DN-';
    const dnNo = prefix + (4000 + this.allDeliveryNotes.filter(d => d.tenantId === this.activeTenantId).length + 1);

    const dnLines: DeliveryNoteLine[] = order.items.map((it, idx) => {
      // Deduct FG stock on physical dispatch
      const inv = this.allInventory.find(i => i.productId === it.productId && i.tenantId === this.activeTenantId);
      if (inv) {
        inv.quantity = Math.max(0, inv.quantity - it.quantity);
        inv.currentStock = inv.quantity;
        inv.reservedQuantity = Math.max(0, inv.reservedQuantity - it.quantity);
        inv.availableQuantity = Math.max(0, inv.quantity - inv.reservedQuantity);
        this.recordTransaction(it.productId, 'DISPATCH', it.quantity, `Dispatched on ${dnNo}`);
      }
      return {
        id: idx + 1,
        orderLineId: it.id || 1,
        productId: it.productId,
        productName: it.productName || 'Product',
        productSku: it.productSku || 'SKU',
        qtyDispatched: it.quantity,
        unit: it.unit || 'UNIT'
      };
    });

    const newDn: DeliveryNote = {
      id: this.allDeliveryNotes.length + 1,
      tenantId: this.activeTenantId,
      dnNumber: dnNo,
      salesOrderId: order.id,
      salesOrderNumber: order.orderNumber,
      customerId: order.customerId,
      customerName: order.customerName,
      dispatchDate: new Date().toISOString().slice(0, 10),
      transporterName,
      trackingNo,
      status: 'DISPATCHED',
      dispatchedBy: this.authService.currentUserValue?.name || 'Store Keeper',
      lines: dnLines,
      createdAt: new Date().toISOString()
    };

    this.allDeliveryNotes.unshift(newDn);
    order.status = 'SHIPPED';
    order.associatedDeliveryNoteId = newDn.id;
    order.associatedDeliveryNoteNumber = newDn.dnNumber;

    this.logAudit('DELIVERY_NOTE_CREATED', 'DeliveryNote', newDn.dnNumber, undefined, `Order: ${order.orderNumber}`);
    this.toast.success(`Delivery Note ${newDn.dnNumber} generated. Goods dispatched via ${transporterName}.`);
    this.publishTenantData(this.activeTenantId);
    return newDn;
  }

  // ==================== M9: INVOICING & CREDIT NOTES ====================
  public generateInvoice(salesOrderId: number, dueDate?: string): Invoice {
    const order = this.allSalesOrders.find(o => o.id === salesOrderId && o.tenantId === this.activeTenantId);
    if (!order) throw new Error('Sales order not found');

    const prefix = this.activeTenantId === 2 ? 'Z-INV-' : 'INV-';
    const invNum = prefix + (5000 + this.allInvoices.filter(i => i.tenantId === this.activeTenantId).length + 1);

    const newInvoice: Invoice = {
      id: this.allInvoices.length + 1,
      tenantId: this.activeTenantId,
      invoiceNumber: invNum,
      salesOrderId: order.id,
      salesOrderNumber: order.orderNumber,
      deliveryNoteId: order.associatedDeliveryNoteId,
      deliveryNoteNumber: order.associatedDeliveryNoteNumber,
      customerId: order.customerId,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerAddress: 'Primary Billing Address',
      invoiceDate: new Date().toISOString().slice(0, 10),
      dueDate: dueDate || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      subtotal: order.subtotal,
      tax: order.taxAmount,
      totalAmount: order.totalAmount,
      paidAmount: 0,
      remainingAmount: order.totalAmount,
      status: 'ISSUED',
      createdAt: new Date().toISOString()
    };

    order.associatedInvoiceId = newInvoice.id;
    order.associatedInvoiceNumber = newInvoice.invoiceNumber;
    order.status = 'INVOICED';

    // Increase customer's open receivables
    const cust = this.allCustomers.find(c => c.id === order.customerId);
    if (cust) cust.openReceivables = (cust.openReceivables || 0) + newInvoice.totalAmount;

    this.allInvoices.unshift(newInvoice);
    this.logAudit('INVOICE_GENERATED', 'Invoice', newInvoice.invoiceNumber, undefined, `Amount: ${newInvoice.totalAmount}`);
    this.toast.success(`Invoice ${newInvoice.invoiceNumber} posted.`);
    this.publishTenantData(this.activeTenantId);
    return newInvoice;
  }

  public createInvoice(salesOrderId: number, dueDate?: string): Invoice {
    return this.generateInvoice(salesOrderId, dueDate);
  }

  public issueCreditNote(invoiceId: number, amount: number, reason: string): CreditNote {
    const inv = this.allInvoices.find(i => i.id === invoiceId && i.tenantId === this.activeTenantId);
    if (!inv) throw new Error('Invoice not found');

    const prefix = this.activeTenantId === 2 ? 'Z-CN-' : 'CN-';
    const cnNo = prefix + (1000 + this.allCreditNotes.filter(c => c.tenantId === this.activeTenantId).length + 1);

    const cn: CreditNote = {
      id: this.allCreditNotes.length + 1,
      tenantId: this.activeTenantId,
      cnNumber: cnNo,
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      customerId: inv.customerId,
      customerName: inv.customerName,
      reason,
      amount,
      createdBy: this.authService.currentUserValue?.name || 'Finance User',
      createdAt: new Date().toISOString()
    };

    inv.remainingAmount = Math.max(0, inv.remainingAmount - amount);
    if (inv.remainingAmount === 0) inv.status = 'PAID';

    this.allCreditNotes.unshift(cn);
    this.logAudit('CREDIT_NOTE_ISSUED', 'CreditNote', cn.cnNumber, undefined, `Amount: ${amount}`);
    this.toast.success(`Credit Note ${cn.cnNumber} issued for ${inv.invoiceNumber}.`);
    this.publishTenantData(this.activeTenantId);
    return cn;
  }

  // ==================== M10: PAYMENTS & AR AGING ====================
  public recordPayment(data: { invoiceId: number; amount: number; paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'UPI' | 'CHEQUE'; transactionReference?: string; notes?: string }): Payment {
    const inv = this.allInvoices.find(i => i.id === data.invoiceId && i.tenantId === this.activeTenantId);
    if (!inv) throw new Error('Invoice not found');

    if (data.amount > inv.remainingAmount) {
      throw new Error(`Payment amount exceeds outstanding balance (${inv.remainingAmount})`);
    }

    const payRef = 'PAY-' + (9000 + this.allPayments.length + 1);
    const newPay: Payment = {
      id: this.allPayments.length + 1,
      tenantId: this.activeTenantId,
      paymentReference: payRef,
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      paymentDate: new Date().toISOString(),
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      transactionReference: data.transactionReference || 'TXN-' + Math.floor(Math.random() * 999999),
      status: 'COMPLETED',
      notes: data.notes,
      recordedBy: this.authService.currentUserValue?.name || 'Finance User',
      createdAt: new Date().toISOString()
    };

    inv.paidAmount += data.amount;
    inv.remainingAmount = Math.max(0, inv.totalAmount - inv.paidAmount);
    inv.status = inv.remainingAmount === 0 ? 'PAID' : 'PARTIALLY_PAID';

    // Reduce customer receivables
    const cust = this.allCustomers.find(c => c.id === inv.customerId);
    if (cust) cust.openReceivables = Math.max(0, (cust.openReceivables || 0) - data.amount);

    this.allPayments.unshift(newPay);
    this.logAudit('PAYMENT_RECORDED', 'Payment', newPay.paymentReference, undefined, `Paid: ${data.amount}`);
    this.toast.success(`Payment of ${data.amount} recorded. Invoice is ${inv.status}.`);
    this.publishTenantData(this.activeTenantId);
    return newPay;
  }

  public getArAgingBuckets(): ArAgingBucket[] {
    const invoices = this.allInvoices.filter(i => i.tenantId === this.activeTenantId && i.remainingAmount > 0);
    const today = new Date();

    const b0_30: Invoice[] = [];
    const b31_60: Invoice[] = [];
    const b61_90: Invoice[] = [];
    const b90_plus: Invoice[] = [];

    invoices.forEach(inv => {
      const invDate = new Date(inv.invoiceDate);
      const diffDays = Math.floor((today.getTime() - invDate.getTime()) / (1000 * 3600 * 24));

      if (diffDays <= 30) b0_30.push(inv);
      else if (diffDays <= 60) b31_60.push(inv);
      else if (diffDays <= 90) b61_90.push(inv);
      else b90_plus.push(inv);
    });

    const sumRemaining = (arr: Invoice[]) => arr.reduce((acc, i) => acc + i.remainingAmount, 0);

    return [
      { bucket: '0-30 Days', totalOutstanding: sumRemaining(b0_30), invoiceCount: b0_30.length, invoices: b0_30 },
      { bucket: '31-60 Days', totalOutstanding: sumRemaining(b31_60), invoiceCount: b31_60.length, invoices: b31_60 },
      { bucket: '61-90 Days', totalOutstanding: sumRemaining(b61_90), invoiceCount: b61_90.length, invoices: b61_90 },
      { bucket: '90+ Days', totalOutstanding: sumRemaining(b90_plus), invoiceCount: b90_plus.length, invoices: b90_plus }
    ];
  }

  public getArAgingSummary(): ArAgingBucket[] {
    return this.getArAgingBuckets();
  }

  // ==================== M11: DASHBOARD SUMMARY ====================
  public getDashboardSummary(): DashboardSummary {
    const orders = this.salesOrdersSub.value;
    const invoices = this.invoicesSub.value;
    const inventory = this.inventorySub.value;
    const pos = this.purchaseOrdersSub.value;
    const payments = this.paymentsSub.value;
    const wos = this.workOrdersSub.value;

    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => ['DRAFT', 'APPROVAL_PENDING', 'APPROVED', 'CONFIRMED'].includes(o.status)).length;
    const productionOrders = orders.filter(o => o.status === 'IN_PROGRESS').length;
    const completedOrders = orders.filter(o => ['SHIPPED', 'INVOICED', 'COMPLETED', 'CLOSED'].includes(o.status)).length;

    const lowStockItems = inventory.filter(i => i.status === 'LOW_STOCK' || i.status === 'OUT_OF_STOCK').length;
    const pendingPurchaseOrders = pos.filter(p => ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ORDERED'].includes(p.status)).length;
    const outstandingInvoices = invoices.filter(i => i.remainingAmount > 0).length;

    const totalRevenue = invoices.reduce((sum, i) => sum + (i.status !== 'CANCELLED' ? i.totalAmount : 0), 0);
    const pendingPayments = invoices.reduce((sum, i) => sum + i.remainingAmount, 0);
    const collectedPayments = payments.reduce((sum, p) => sum + p.amount, 0);

    const onTimeDeliveryPct = 96.4;

    const orderStatusDistribution = [
      { status: 'DRAFT', count: orders.filter(o => o.status === 'DRAFT').length },
      { status: 'PENDING_APPROVAL', count: orders.filter(o => o.status === 'APPROVAL_PENDING').length },
      { status: 'APPROVED', count: orders.filter(o => o.status === 'APPROVED').length },
      { status: 'IN_PROGRESS', count: orders.filter(o => o.status === 'IN_PROGRESS').length },
      { status: 'SHIPPED', count: orders.filter(o => o.status === 'SHIPPED' || o.status === 'INVOICED').length },
      { status: 'COMPLETED', count: orders.filter(o => o.status === 'COMPLETED' || o.status === 'CLOSED').length }
    ].filter(s => s.count > 0);

    const productionStatusDistribution = [
      { status: 'PLANNED', count: wos.filter(w => w.status === 'PLANNED').length },
      { status: 'IN_PROGRESS', count: wos.filter(w => w.status === 'IN_PROGRESS').length },
      { status: 'COMPLETED', count: wos.filter(w => w.status === 'COMPLETED').length }
    ].filter(s => s.count > 0);

    const inventoryLevels = inventory.map(i => ({
      productName: i.productName,
      available: i.availableQuantity,
      reserved: i.reservedQuantity,
      reorderLevel: i.reorderLevel,
      status: i.status
    }));

    return {
      totalOrders,
      pendingOrders,
      productionOrders,
      completedOrders,
      lowStockItems,
      pendingPurchaseOrders,
      outstandingInvoices,
      totalRevenue,
      pendingPayments,
      collectedPayments,
      onTimeDeliveryPct,
      ordersTrend: [
        { period: 'May', orders: 15 },
        { period: 'Jun', orders: 22 },
        { period: 'Jul', orders: 30 },
        { period: 'Aug', orders: 38 },
        { period: 'Sep', orders: 45 },
        { period: 'Oct', orders: 52 }
      ],
      revenueTrend: [
        { period: 'May', revenue: 380000 },
        { period: 'Jun', revenue: 540000 },
        { period: 'Jul', revenue: 690000 },
        { period: 'Aug', revenue: 840000 },
        { period: 'Sep', revenue: 950000 },
        { period: 'Oct', revenue: 1150000 }
      ],
      productionStatusDistribution,
      inventoryLevels,
      orderStatusDistribution,
      arAging: this.getArAgingBuckets()
    };
  }

  // ==================== USER MANAGEMENT ====================
  public toggleUserStatus(userId: number): void {
    const user = this.allUsers.find(u => u.id === userId && u.tenantId === this.activeTenantId);
    if (user) {
      user.isActive = !user.isActive;
      this.logAudit('USER_STATUS_TOGGLED', 'User', user.email, undefined, `Active: ${user.isActive}`);
      this.publishTenantData(this.activeTenantId);
      this.toast.info(`User ${user.email} status toggled.`);
    }
  }

  public addUser(userData: Omit<User, 'id' | 'createdAt'>): User {
    const newUser: User = {
      ...userData,
      id: this.allUsers.length + 1,
      tenantId: this.activeTenantId,
      createdAt: new Date().toISOString()
    };
    this.allUsers.unshift(newUser);
    this.logAudit('USER_CREATED', 'User', newUser.email, undefined, `Role: ${newUser.roles.join(', ')}`);
    this.toast.success(`User ${newUser.name} created for tenant.`);
    this.publishTenantData(this.activeTenantId);
    return newUser;
  }
}
