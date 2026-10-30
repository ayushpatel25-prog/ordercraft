-- =====================================================================
-- ORDERCRAFT V2: Seed 2 Demo Tenants with Isolated Business Data
-- Proves tenant isolation across OTC & PTP lifecycles
-- =====================================================================

SET NAMES utf8mb4;

-- 1. Insert 2 Tenants
INSERT INTO `tenant` (`id`, `public_id`, `code`, `name`, `plan`, `status`, `timezone`, `currency`, `settings_json`) VALUES
(1, '3fa85f64-5717-4562-b3fc-2c963f66afa6', 'APEX_MFG', 'Apex Precision Mfg Pvt Ltd', 'ENTERPRISE', 'ACTIVE', 'Asia/Kolkata', 'INR',
 '{"approval_threshold": 500000.0, "max_discount_pct": 15.0, "tax_regime": "GST_IN", "fiscal_year": "2026-2027", "lockout_threshold": 5}'),
(2, '7cb92e15-8428-4981-a1ab-5e821b55bed7', 'ZENITH_IND', 'Zenith Industrial Equipments LLC', 'ENTERPRISE', 'ACTIVE', 'America/Chicago', 'USD',
 '{"approval_threshold": 50000.0, "max_discount_pct": 10.0, "tax_regime": "SALES_TAX_US", "fiscal_year": "2026", "lockout_threshold": 5}');

-- 2. Insert Permissions
INSERT INTO `permission` (`id`, `code`, `module`, `description`) VALUES
(1, 'TENANT_MANAGE', 'IAM', 'Manage tenant settings and subscriptions'),
(2, 'USER_MANAGE', 'IAM', 'Manage users and assign roles'),
(3, 'CUSTOMER_READ', 'MASTER_DATA', 'View customer details and credit limits'),
(4, 'CUSTOMER_WRITE', 'MASTER_DATA', 'Create and modify customer records'),
(5, 'PRODUCT_READ', 'MASTER_DATA', 'View catalog products and pricing'),
(6, 'PRODUCT_WRITE', 'MASTER_DATA', 'Create and modify products and UoMs'),
(7, 'BOM_READ', 'BOM', 'View bill of materials hierarchies'),
(8, 'BOM_WRITE', 'BOM', 'Create and activate BOM versions'),
(9, 'ORDER_CREATE', 'SALES_ORDER', 'Create quotes and draft sales orders'),
(10, 'ORDER_APPROVE', 'SALES_ORDER', 'Approve orders above threshold or high discount'),
(11, 'STOCK_READ', 'INVENTORY', 'View stock balances and ledger movements'),
(12, 'STOCK_ADJUST', 'INVENTORY', 'Perform manual stock adjustments and transfers'),
(13, 'PO_CREATE', 'PROCUREMENT', 'Create purchase requisitions and purchase orders'),
(14, 'PO_APPROVE', 'PROCUREMENT', 'Approve purchase orders for supplier dispatch'),
(15, 'GRN_RECEIVE', 'PROCUREMENT', 'Receive incoming consignments and inspect QC'),
(16, 'WO_MANAGE', 'PRODUCTION', 'Dispatch and manage work orders and stage routing'),
(17, 'WO_ISSUE_MATERIAL', 'PRODUCTION', 'Issue raw materials to production floor'),
(18, 'DISPATCH_MANAGE', 'DISPATCH', 'Create delivery notes and dispatch finished goods'),
(19, 'INVOICE_ISSUE', 'INVOICING', 'Generate and post gap-free tax invoices'),
(20, 'PAYMENT_ALLOCATE', 'PAYMENTS', 'Record customer payments and allocate to invoices'),
(21, 'REPORT_VIEW', 'REPORTING', 'View analytical dashboards and download exports');

-- 3. System Roles (Tenant-scoped or global)
INSERT INTO `role` (`id`, `tenant_id`, `code`, `name`, `description`, `is_system`) VALUES
(1, NULL, 'PLATFORM_ADMIN', 'Platform Administrator', 'Global SaaS platform maintainer', TRUE),
(2, 1, 'TENANT_ADMIN', 'Apex Tenant Administrator', 'Full administration for Apex Mfg', FALSE),
(3, 1, 'SALES_EXECUTIVE', 'Apex Sales Executive', 'Order bookings and customer relations', FALSE),
(4, 1, 'SALES_MANAGER', 'Apex Sales Manager', 'Approval of high-value quotations & orders', FALSE),
(5, 1, 'PRODUCTION_PLANNER', 'Apex Production Planner', 'BOM design, work orders, shop floor', FALSE),
(6, 1, 'PROCUREMENT_OFFICER', 'Apex Procurement Officer', 'Requisitions, purchase orders, vendor relations', FALSE),
(7, 1, 'STORE_KEEPER', 'Apex Store Keeper', 'Goods receipt, stock adjustments, dispatch', FALSE),
(8, 1, 'FINANCE_USER', 'Apex Finance Officer', 'Invoicing, payment collection, AR aging', FALSE),
(9, 1, 'VIEWER', 'Apex Read-Only Viewer', 'Executive dashboards and reports', FALSE),
-- Tenant 2 Roles
(10, 2, 'TENANT_ADMIN', 'Zenith Tenant Administrator', 'Full administration for Zenith Equipments', FALSE),
(11, 2, 'SALES_EXECUTIVE', 'Zenith Sales Executive', 'Zenith order bookings', FALSE),
(12, 2, 'PRODUCTION_PLANNER', 'Zenith Production Planner', 'Zenith BOMs and assembly', FALSE),
(13, 2, 'FINANCE_USER', 'Zenith Finance Officer', 'Zenith US billing and payments', FALSE);

-- Assign Permissions to Tenant 1 Roles
-- TENANT_ADMIN has all permissions 1-21
INSERT INTO `role_permission` (`role_id`, `permission_id`)
SELECT 2, id FROM `permission`;

-- SALES_EXECUTIVE: 3,4,5,7,9,11,18,21
INSERT INTO `role_permission` (`role_id`, `permission_id`) VALUES
(3, 3), (3, 4), (3, 5), (3, 7), (3, 9), (3, 11), (3, 18), (3, 21);

-- SALES_MANAGER: 3,4,5,7,9,10,11,18,21
INSERT INTO `role_permission` (`role_id`, `permission_id`) VALUES
(4, 3), (4, 4), (4, 5), (4, 7), (4, 9), (4, 10), (4, 11), (4, 18), (4, 21);

-- PRODUCTION_PLANNER: 5,7,8,11,16,17,21
INSERT INTO `role_permission` (`role_id`, `permission_id`) VALUES
(5, 5), (5, 7), (5, 8), (5, 11), (5, 16), (5, 17), (5, 21);

-- PROCUREMENT_OFFICER: 5,6,11,13,14,15,21
INSERT INTO `role_permission` (`role_id`, `permission_id`) VALUES
(6, 5), (6, 6), (6, 11), (6, 13), (6, 14), (6, 15), (6, 21);

-- STORE_KEEPER: 5,11,12,15,17,18,21
INSERT INTO `role_permission` (`role_id`, `permission_id`) VALUES
(7, 5), (7, 11), (7, 12), (7, 15), (7, 17), (7, 18), (7, 21);

-- FINANCE_USER: 3,5,11,19,20,21
INSERT INTO `role_permission` (`role_id`, `permission_id`) VALUES
(8, 3), (8, 5), (8, 11), (8, 19), (8, 20), (8, 21);

-- VIEWER: 3,5,7,11,21
INSERT INTO `role_permission` (`role_id`, `permission_id`) VALUES
(9, 3), (9, 5), (9, 7), (9, 11), (9, 21);

-- 4. Users (BCrypt 12 hash of 'Password@123' is $2a$12$e80fD7WkEkg71v/mPq8RreJm1k9mSgq674Uf.bC1.yFkJZ0/YcTki)
INSERT INTO `app_user` (`id`, `tenant_id`, `public_id`, `email`, `password_hash`, `name`, `status`, `failed_attempts`) VALUES
-- Tenant 1 Users
(1, 1, '11111111-1111-1111-1111-111111111111', 'admin@apex.com', '$2a$12$e80fD7WkEkg71v/mPq8RreJm1k9mSgq674Uf.bC1.yFkJZ0/YcTki', 'Rajesh Sharma (Admin)', 'ACTIVE', 0),
(2, 1, '22222222-2222-2222-2222-222222222222', 'sales@apex.com', '$2a$12$e80fD7WkEkg71v/mPq8RreJm1k9mSgq674Uf.bC1.yFkJZ0/YcTki', 'Ayush Patel (Sales Exec)', 'ACTIVE', 0),
(3, 1, '33333333-3333-3333-3333-333333333333', 'salesmgr@apex.com', '$2a$12$e80fD7WkEkg71v/mPq8RreJm1k9mSgq674Uf.bC1.yFkJZ0/YcTki', 'Meera Deshmukh (Sales Mgr)', 'ACTIVE', 0),
(4, 1, '44444444-4444-4444-4444-444444444444', 'planner@apex.com', '$2a$12$e80fD7WkEkg71v/mPq8RreJm1k9mSgq674Uf.bC1.yFkJZ0/YcTki', 'Vikram Rao (Plant Lead)', 'ACTIVE', 0),
(5, 1, '55555555-5555-5555-5555-555555555555', 'procurement@apex.com', '$2a$12$e80fD7WkEkg71v/mPq8RreJm1k9mSgq674Uf.bC1.yFkJZ0/YcTki', 'Sunita Joshi (Procurement)', 'ACTIVE', 0),
(6, 1, '66666666-6666-6666-6666-666666666666', 'store@apex.com', '$2a$12$e80fD7WkEkg71v/mPq8RreJm1k9mSgq674Uf.bC1.yFkJZ0/YcTki', 'Karan Varma (Store Keeper)', 'ACTIVE', 0),
(7, 1, '77777777-7777-7777-7777-777777777777', 'finance@apex.com', '$2a$12$e80fD7WkEkg71v/mPq8RreJm1k9mSgq674Uf.bC1.yFkJZ0/YcTki', 'Naveen Goyal (Finance)', 'ACTIVE', 0),
-- Tenant 2 Users
(8, 2, '88888888-8888-8888-8888-888888888888', 'admin@zenith.com', '$2a$12$e80fD7WkEkg71v/mPq8RreJm1k9mSgq674Uf.bC1.yFkJZ0/YcTki', 'Sarah Jenkins (Admin)', 'ACTIVE', 0),
(9, 2, '99999999-9999-9999-9999-999999999999', 'sales@zenith.com', '$2a$12$e80fD7WkEkg71v/mPq8RreJm1k9mSgq674Uf.bC1.yFkJZ0/YcTki', 'David Miller (Sales)', 'ACTIVE', 0);

-- Assign Roles
INSERT INTO `user_role` (`user_id`, `role_id`) VALUES
(1, 2), -- admin@apex -> TENANT_ADMIN
(2, 3), -- sales@apex -> SALES_EXECUTIVE
(3, 4), -- salesmgr@apex -> SALES_MANAGER
(4, 5), -- planner@apex -> PRODUCTION_PLANNER
(5, 6), -- procurement@apex -> PROCUREMENT_OFFICER
(6, 7), -- store@apex -> STORE_KEEPER
(7, 8), -- finance@apex -> FINANCE_USER
(8, 10), -- admin@zenith -> TENANT_ADMIN (T2)
(9, 11); -- sales@zenith -> SALES_EXECUTIVE (T2)

-- 5. UoMs for Tenant 1 and Tenant 2
INSERT INTO `uom` (`id`, `tenant_id`, `code`, `name`, `description`) VALUES
(1, 1, 'UNIT', 'Unit / Piece', 'Discrete finished goods unit'),
(2, 1, 'PCS', 'Pieces', 'Standard piece count'),
(3, 1, 'KG', 'Kilogram', 'Metric weight unit'),
(4, 1, 'MTR', 'Meter', 'Length unit'),
(5, 1, 'SHT', 'Sheet', 'Metal sheet 8x4 panel'),
(6, 2, 'EA', 'Each', 'US discrete each item'),
(7, 2, 'LB', 'Pound', 'Imperial weight unit');

-- 6. Warehouses
INSERT INTO `warehouse` (`id`, `tenant_id`, `public_id`, `code`, `name`, `address`) VALUES
(1, 1, 'w1111111-1111-1111-1111-111111111111', 'WH-PUNE-CENTRAL', 'Pune Central Distribution Hub', 'Plot 42 MIDC Industrial Area, Pune 411018'),
(2, 1, 'w2222222-2222-2222-2222-222222222222', 'WH-PUNE-PLANT', 'Pune Plant Shop Floor Staging', 'Bay 1-4, Chakan Plant, Pune'),
(3, 2, 'w3333333-3333-3333-3333-333333333333', 'WH-CHICAGO-MAIN', 'Chicago Distribution Center', '1040 W Jackson Blvd, Chicago, IL 60607');

-- 7. Document Sequences (Gap-Free Support)
INSERT INTO `document_sequence` (`tenant_id`, `doc_type`, `fiscal_year`, `next_value`, `prefix`, `padding`) VALUES
(1, 'ORDER', '2026-2027', 1004, 'SO-', 5),
(1, 'INVOICE', '2026-2027', 5003, 'INV-', 5),
(1, 'WO', '2026-2027', 1003, 'WO-', 5),
(1, 'PO', '2026-2027', 2003, 'PO-', 5),
(1, 'GRN', '2026-2027', 3001, 'GRN-', 5),
(1, 'DN', '2026-2027', 4001, 'DN-', 5),
(1, 'CN', '2026-2027', 1001, 'CN-', 5),
(2, 'ORDER', '2026', 101, 'Z-SO-', 4),
(2, 'INVOICE', '2026', 201, 'Z-INV-', 4);

-- 8. Master Data: Customers
INSERT INTO `customer` (`id`, `tenant_id`, `public_id`, `code`, `name`, `email`, `phone`, `tax_id`, `credit_limit`, `payment_terms_days`, `status`) VALUES
(1, 1, 'c1111111-1111-1111-1111-111111111111', 'CUST-ABC', 'ABC Heavy Machinery Pvt Ltd', 'procurement@abcmfg.com', '+91 98201 12345', '27AAACA1234A1Z5', 1000000.0000, 30, 'ACTIVE'),
(2, 1, 'c2222222-2222-2222-2222-222222222222', 'CUST-TECHNO', 'Techno Fluid Systems', 'orders@technoind.com', '+91 98450 54321', '29BBBCB5678B1Z2', 500000.0000, 45, 'ACTIVE'),
(3, 2, 'c3333333-3333-3333-3333-333333333333', 'CUST-MIDWEST', 'Midwest Turbine Corp', 'orders@midwestturbine.com', '+1 312 555 0199', 'US-EIN-3648912', 250000.0000, 30, 'ACTIVE');

-- 9. Master Data: Suppliers
INSERT INTO `supplier` (`id`, `tenant_id`, `public_id`, `code`, `name`, `contact_person`, `email`, `phone`, `rating`, `lead_time_days`) VALUES
(1, 1, 's1111111-1111-1111-1111-111111111111', 'SUP-BHARAT', 'Bharat Electric Motors Ltd', 'Ramesh Sharma', 'supply@bharatmotors.in', '+91 22 2500 1122', 4.90, 5),
(2, 1, 's2222222-2222-2222-2222-222222222222', 'SUP-FASTEN', 'Apex Fasteners & Bearings', 'Anita Deshmukh', 'orders@apexfasteners.com', '+91 20 2712 3344', 4.80, 3),
(3, 2, 's3333333-3333-3333-3333-333333333333', 'SUP-ALLIED', 'Allied Precision US', 'John Smith', 'sales@alliedprecision.us', '+1 800 555 4433', 4.95, 4);

-- 10. Master Data: Products (Tenant 1: Discrete Pumps; Tenant 2: Hydraulic Actuators)
INSERT INTO `product` (`id`, `tenant_id`, `public_id`, `sku`, `name`, `type`, `uom_id`, `tax_rate`, `standard_cost`, `selling_price`, `reorder_level`) VALUES
-- Finished Goods (Tenant 1)
(1, 1, 'p1111111-1111-1111-1111-111111111111', 'FG-PUMP-500', 'Industrial Centrifugal Pump X-500', 'FINISHED', 1, 18.0000, 32000.0000, 45000.0000, 5.0000),
(2, 1, 'p2222222-2222-2222-2222-222222222222', 'FG-CTRL-100', 'Smart Motor Control Panel CP-100', 'FINISHED', 1, 18.0000, 22000.0000, 32000.0000, 3.0000),
-- Sub-Assemblies & Raw Materials (Tenant 1)
(3, 1, 'p3333333-3333-3333-3333-333333333333', 'SA-MTR-05', 'High-Torque Electric Motor 5HP', 'SEMI', 1, 18.0000, 12500.0000, 16000.0000, 8.0000),
(4, 1, 'p4444444-4444-4444-4444-444444444444', 'RM-STL-HSG', 'Cast Iron Pump Housing Shell', 'RAW', 2, 18.0000, 2800.0000, 3500.0000, 15.0000),
(5, 1, 'p5555555-5555-5555-5555-555555555555', 'RM-BRG-6205', 'Deep Groove Ball Bearing 6205', 'RAW', 2, 18.0000, 450.0000, 600.0000, 20.0000),
(6, 1, 'p6666666-6666-6666-6666-666666666666', 'RM-SCR-M8', 'Stainless Steel Hex Bolt M8x30', 'RAW', 2, 18.0000, 15.0000, 25.0000, 50.0000),
-- Tenant 2 Products (Separated)
(7, 2, 'p7777777-7777-7777-7777-777777777777', 'FG-ACT-200', 'Heavy Hydraulic Actuator 200kN', 'FINISHED', 6, 8.2500, 1200.0000, 2400.0000, 2.0000),
(8, 2, 'p8888888-8888-8888-8888-888888888888', 'RM-CYL-10', 'Precision Chrome Cylinder Rod', 'RAW', 6, 8.2500, 350.0000, 500.0000, 5.0000);

-- 11. BOM Header & Lines (Tenant 1: 3-Level BOM for Pump X-500)
INSERT INTO `bom_header` (`id`, `tenant_id`, `public_id`, `product_id`, `version_no`, `status`, `description`) VALUES
(1, 1, 'b1111111-1111-1111-1111-111111111111', 1, '1.0', 'ACTIVE', 'Standard Production BOM for Pump X-500'),
(2, 1, 'b2222222-2222-2222-2222-222222222222', 3, '1.0', 'ACTIVE', 'Sub-Assembly BOM for Motor 5HP');

-- Level 1 of Pump X-500
INSERT INTO `bom_line` (`bom_id`, `component_product_id`, `qty_per`, `scrap_pct`, `uom_id`, `seq`) VALUES
(1, 3, 1.0000, 0.0000, 1, 1), -- 1x Motor 5HP
(1, 4, 1.0000, 2.0000, 2, 2), -- 1x Housing Shell (2% scrap)
(1, 5, 2.0000, 0.0000, 2, 3), -- 2x Bearings 6205
(1, 6, 8.0000, 5.0000, 2, 4); -- 8x Fasteners M8 (5% scrap allowance)

-- Level 2 of Motor 5HP
INSERT INTO `bom_line` (`bom_id`, `component_product_id`, `qty_per`, `scrap_pct`, `uom_id`, `seq`) VALUES
(2, 5, 2.0000, 0.0000, 2, 1), -- 2x Bearings in Motor
(2, 6, 4.0000, 0.0000, 2, 2); -- 4x Fasteners in Motor

-- 12. Initial Stock Balances (Tenant 1)
INSERT INTO `stock_balance` (`tenant_id`, `product_id`, `warehouse_id`, `batch_id`, `on_hand`, `reserved`) VALUES
(1, 1, 1, 'LOT-PUMP-01', 15.0000, 5.0000), -- 10 available
(1, 2, 1, 'LOT-CTRL-01', 8.0000, 2.0000),  -- 6 available
(1, 3, 2, 'LOT-MTR-01', 24.0000, 6.0000),  -- 18 available
(1, 4, 2, 'LOT-HSG-01', 30.0000, 10.0000), -- 20 available
(1, 5, 2, 'LOT-BRG-01', 8.0000, 2.0000),   -- 6 available (LOW STOCK - threshold 20)
(1, 6, 2, 'LOT-SCR-01', 120.0000, 40.0000),-- 80 available
-- Tenant 2 Stock
(2, 7, 3, 'LOT-ACT-01', 6.0000, 1.0000),
(2, 8, 3, 'LOT-CYL-01', 20.0000, 4.0000);

-- 13. Sample Sales Orders
INSERT INTO `sales_order` (`id`, `tenant_id`, `public_id`, `order_no`, `customer_id`, `status`, `order_date`, `requested_delivery_date`, `currency`, `subtotal`, `discount_total`, `tax_total`, `grand_total`, `revision_no`, `created_by`) VALUES
(1, 1, 'so111111-1111-1111-1111-111111111111', 'SO-1001', 1, 'IN_PRODUCTION', '2026-09-25', '2026-10-15', 'INR', 225000.0000, 0.0000, 40500.0000, 265500.0000, 1, 'ayush@apex.com'),
(2, 1, 'so222222-2222-2222-2222-222222222222', 'SO-1002', 2, 'APPROVED', '2026-09-28', '2026-10-20', 'INR', 128000.0000, 0.0000, 23040.0000, 151040.0000, 1, 'ayush@apex.com'),
(3, 1, 'so333333-3333-3333-3333-333333333333', 'SO-1003', 1, 'CLOSED', '2026-09-15', '2026-09-28', 'INR', 135000.0000, 0.0000, 24300.0000, 159300.0000, 1, 'ayush@apex.com');

INSERT INTO `sales_order_line` (`order_id`, `line_no`, `product_id`, `qty`, `uom_id`, `unit_price`, `discount_pct`, `tax_rate`, `line_total`, `qty_shipped`, `qty_invoiced`) VALUES
(1, 1, 1, 5.0000, 1, 45000.0000, 0.0000, 18.0000, 225000.0000, 0.0000, 0.0000),
(2, 1, 2, 4.0000, 1, 32000.0000, 0.0000, 18.0000, 128000.0000, 0.0000, 0.0000),
(3, 1, 1, 3.0000, 1, 45000.0000, 0.0000, 18.0000, 135000.0000, 3.0000, 3.0000);

-- 14. Work Orders
INSERT INTO `work_order` (`id`, `tenant_id`, `public_id`, `wo_no`, `sales_order_line_id`, `product_id`, `bom_id`, `qty_planned`, `qty_completed`, `status`, `planned_start`, `planned_end`, `assigned_lead`) VALUES
(1, 1, 'wo111111-1111-1111-1111-111111111111', 'WO-1001', 1, 1, 1, 5.0000, 3.0000, 'IN_PROGRESS', '2026-09-26', '2026-10-05', 'Vikram Rao'),
(2, 1, 'wo222222-2222-2222-2222-222222222222', 'WO-1002', 2, 2, 1, 4.0000, 0.0000, 'RELEASED', '2026-09-29', '2026-10-06', 'Vikram Rao');

-- 15. Purchase Orders
INSERT INTO `purchase_order` (`id`, `tenant_id`, `public_id`, `po_no`, `supplier_id`, `status`, `order_date`, `expected_delivery_date`, `subtotal`, `tax_total`, `grand_total`, `created_by`, `approved_by`) VALUES
(1, 1, 'po111111-1111-1111-1111-111111111111', 'PO-2001', 2, 'APPROVED', '2026-09-28', '2026-10-03', 18000.0000, 3240.0000, 21240.0000, 'sunita@apex.com', 'sunita@apex.com');

INSERT INTO `purchase_order_line` (`po_id`, `line_no`, `product_id`, `qty_ordered`, `qty_received`, `unit_price`, `line_total`) VALUES
(1, 1, 5, 40.0000, 0.0000, 450.0000, 18000.0000);

-- 16. Invoices & Payments (SO-1003 settled, SO-1001 partially paid)
INSERT INTO `invoice` (`id`, `tenant_id`, `public_id`, `invoice_no`, `customer_id`, `order_id`, `status`, `issue_date`, `due_date`, `subtotal`, `tax_total`, `grand_total`, `amount_paid`, `balance`, `created_by`) VALUES
(1, 1, 'in111111-1111-1111-1111-111111111111', 'INV-5001', 1, 3, 'PAID', '2026-09-28', '2026-10-28', 135000.0000, 24300.0000, 159300.0000, 159300.0000, 0.0000, 'finance@apex.com'),
(2, 1, 'in222222-2222-2222-2222-222222222222', 'INV-5002', 1, 1, 'PARTIALLY_PAID', '2026-09-29', '2026-10-29', 225000.0000, 40500.0000, 265500.0000, 100000.0000, 165500.0000, 'finance@apex.com');

INSERT INTO `payment` (`id`, `tenant_id`, `public_id`, `payment_ref`, `customer_id`, `amount`, `method`, `transaction_reference`, `received_at`, `unallocated_amount`, `created_by`) VALUES
(1, 1, 'py111111-1111-1111-1111-111111111111', 'PAY-9001', 1, 159300.0000, 'BANK_TRANSFER', 'NEFT-HDFC-99882233', '2026-09-29 10:30:00', 0.0000, 'finance@apex.com'),
(2, 1, 'py222222-2222-2222-2222-222222222222', 'PAY-9002', 1, 100000.0000, 'BANK_TRANSFER', 'RTGS-ICICI-44551122', '2026-09-30 09:15:00', 0.0000, 'finance@apex.com');

INSERT INTO `payment_allocation` (`payment_id`, `invoice_id`, `amount`) VALUES
(1, 1, 159300.0000),
(2, 2, 100000.0000);
