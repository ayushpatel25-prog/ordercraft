-- ====================================================================
-- ORDERCRAFT Manufacturing Seed Data (Oracle SQL)
-- Standard Password for all demo accounts: Password@123
-- BCrypt: $2a$10$7R9r7rJc08qfXv9K65gOpu5jU.4l1UjLZZK41aMfqPzYgL1fVqPje
-- ====================================================================

-- ROLES
INSERT INTO roles (name, description) VALUES ('ADMIN', 'Full system administrator with unrestricted access');
INSERT INTO roles (name, description) VALUES ('SALES', 'Sales executive: customer & sales order lifecycle');
INSERT INTO roles (name, description) VALUES ('PRODUCTION_MANAGER', 'Production manager: BOM, work orders & material consumption');
INSERT INTO roles (name, description) VALUES ('PROCUREMENT_OFFICER', 'Procurement officer: suppliers, shortages & purchase orders');
INSERT INTO roles (name, description) VALUES ('FINANCE_OFFICER', 'Finance officer: invoices, payments & financial reports');

-- PERMISSIONS
INSERT INTO permissions (name, module, description) VALUES ('USER_MANAGE', 'ADMIN', 'Manage system users and access');
INSERT INTO permissions (name, module, description) VALUES ('ORDER_CREATE', 'SALES', 'Create and confirm sales orders');
INSERT INTO permissions (name, module, description) VALUES ('BOM_MANAGE', 'PRODUCTION', 'Manage bills of materials');
INSERT INTO permissions (name, module, description) VALUES ('WORK_ORDER_MANAGE', 'PRODUCTION', 'Manage and execute shop-floor work orders');
INSERT INTO permissions (name, module, description) VALUES ('PO_MANAGE', 'PROCUREMENT', 'Issue and receive purchase orders');
INSERT INTO permissions (name, module, description) VALUES ('INVOICE_MANAGE', 'FINANCE', 'Generate invoices and collect payments');

-- USERS (Password: Password@123)
INSERT INTO users (name, email, password_hash, is_active) VALUES ('System Administrator', 'admin@ordercraft.com', '$2a$10$7R9r7rJc08qfXv9K65gOpu5jU.4l1UjLZZK41aMfqPzYgL1fVqPje', 1);
INSERT INTO users (name, email, password_hash, is_active) VALUES ('Ayush Patel (Sales)', 'sales@ordercraft.com', '$2a$10$7R9r7rJc08qfXv9K65gOpu5jU.4l1UjLZZK41aMfqPzYgL1fVqPje', 1);
INSERT INTO users (name, email, password_hash, is_active) VALUES ('Vikram Rao (Production)', 'production@ordercraft.com', '$2a$10$7R9r7rJc08qfXv9K65gOpu5jU.4l1UjLZZK41aMfqPzYgL1fVqPje', 1);
INSERT INTO users (name, email, password_hash, is_active) VALUES ('Sunita Sharma (Procurement)', 'procurement@ordercraft.com', '$2a$10$7R9r7rJc08qfXv9K65gOpu5jU.4l1UjLZZK41aMfqPzYgL1fVqPje', 1);
INSERT INTO users (name, email, password_hash, is_active) VALUES ('Rajesh Verma (Finance)', 'finance@ordercraft.com', '$2a$10$7R9r7rJc08qfXv9K65gOpu5jU.4l1UjLZZK41aMfqPzYgL1fVqPje', 1);

-- USER_ROLES
INSERT INTO user_roles (user_id, role_id) VALUES (1, 1);
INSERT INTO user_roles (user_id, role_id) VALUES (2, 2);
INSERT INTO user_roles (user_id, role_id) VALUES (3, 3);
INSERT INTO user_roles (user_id, role_id) VALUES (4, 4);
INSERT INTO user_roles (user_id, role_id) VALUES (5, 5);

-- CUSTOMERS
INSERT INTO customers (name, email, phone, address, city, state, postal_code, status) VALUES 
('ABC Manufacturing Pvt Ltd', 'procurement@abcmfg.com', '+91 98201 12345', 'Plot 42, MIDC Industrial Area', 'Pune', 'Maharashtra', '411018', 'ACTIVE');
INSERT INTO customers (name, email, phone, address, city, state, postal_code, status) VALUES 
('Techno Industries', 'orders@technoind.com', '+91 98450 54321', '88 Peenya Industrial Estate', 'Bengaluru', 'Karnataka', '560058', 'ACTIVE');
INSERT INTO customers (name, email, phone, address, city, state, postal_code, status) VALUES 
('Global Engineering Ltd', 'contact@globaleng.com', '+91 99100 87654', 'B-12 Sector 63', 'Noida', 'Uttar Pradesh', '201301', 'ACTIVE');
INSERT INTO customers (name, email, phone, address, city, state, postal_code, status) VALUES 
('Apex Automotive Corp', 'supplychain@apexauto.in', '+91 97234 11223', 'Sanand Industrial Park', 'Ahmedabad', 'Gujarat', '382170', 'ACTIVE');

-- PRODUCTS: Finished Goods & Raw Materials
-- FG
INSERT INTO products (name, sku, description, unit_price, unit, category, status) VALUES 
('Industrial Pump X-500', 'FG-PUMP-500', 'Heavy-duty 5HP high-pressure centrifugal water pump', 45000.00, 'UNIT', 'FINISHED_GOOD', 'ACTIVE');
INSERT INTO products (name, sku, description, unit_price, unit, category, status) VALUES 
('Control Panel CP-100', 'FG-CTRL-100', 'Automated programmable logic control panel with IP65 enclosure', 32000.00, 'UNIT', 'FINISHED_GOOD', 'ACTIVE');
INSERT INTO products (name, sku, description, unit_price, unit, category, status) VALUES 
('Industrial Motor 5HP', 'FG-MTR-05', 'Three-phase 415V 1440RPM induction electric motor', 18500.00, 'UNIT', 'FINISHED_GOOD', 'ACTIVE');

-- RM
INSERT INTO products (name, sku, description, unit_price, unit, category, status) VALUES 
('Steel Housing Shell', 'RM-STL-HSG', 'Cast iron precision machined outer pump housing', 8500.00, 'PCS', 'RAW_MATERIAL', 'ACTIVE');
INSERT INTO products (name, sku, description, unit_price, unit, category, status) VALUES 
('Deep Groove Ball Bearing 6205', 'RM-BRG-6205', 'High-speed chrome steel double sealed ball bearing', 450.00, 'PCS', 'RAW_MATERIAL', 'ACTIVE');
INSERT INTO products (name, sku, description, unit_price, unit, category, status) VALUES 
('Stainless Hex Bolt M8x30', 'RM-SCR-M8', 'Grade 304 stainless steel metric hex fastener bolt', 15.00, 'PCS', 'RAW_MATERIAL', 'ACTIVE');
INSERT INTO products (name, sku, description, unit_price, unit, category, status) VALUES 
('Copper Enamelled Winding Wire', 'RM-CPR-WRE', 'Super enamelled Grade 2 copper winding wire spool', 920.00, 'KG', 'RAW_MATERIAL', 'ACTIVE');
INSERT INTO products (name, sku, description, unit_price, unit, category, status) VALUES 
('Cold Rolled Steel Sheet 2mm', 'RM-STL-SHT', '2mm CRCA steel sheet 8x4 ft panel', 3400.00, 'SHT', 'RAW_MATERIAL', 'ACTIVE');

-- INVENTORY
INSERT INTO inventory (product_id, quantity, reserved_quantity, reorder_level, location, status) VALUES 
(1, 15.00, 5.00, 5.00, 'Warehouse A - Bay 1', 'IN_STOCK');
INSERT INTO inventory (product_id, quantity, reserved_quantity, reorder_level, location, status) VALUES 
(2, 8.00, 2.00, 3.00, 'Warehouse A - Bay 2', 'IN_STOCK');
INSERT INTO inventory (product_id, quantity, reserved_quantity, reorder_level, location, status) VALUES 
(3, 24.00, 6.00, 8.00, 'Warehouse B - Rack 3', 'IN_STOCK');
INSERT INTO inventory (product_id, quantity, reserved_quantity, reorder_level, location, status) VALUES 
(4, 30.00, 10.00, 15.00, 'Warehouse B - Bin 12', 'IN_STOCK');
INSERT INTO inventory (product_id, quantity, reserved_quantity, reorder_level, location, status) VALUES 
(5, 8.00, 2.00, 20.00, 'Warehouse C - Bin 4', 'LOW_STOCK'); -- Low stock item!
INSERT INTO inventory (product_id, quantity, reserved_quantity, reorder_level, location, status) VALUES 
(6, 120.00, 40.00, 50.00, 'Warehouse C - Bin 5', 'IN_STOCK');
INSERT INTO inventory (product_id, quantity, reserved_quantity, reorder_level, location, status) VALUES 
(7, 4.00, 0.00, 15.00, 'Warehouse C - Bin 8', 'LOW_STOCK'); -- Low stock item!
INSERT INTO inventory (product_id, quantity, reserved_quantity, reorder_level, location, status) VALUES 
(8, 45.00, 12.00, 10.00, 'Warehouse A - Sheet Yard', 'IN_STOCK');

-- BOMS
-- BOM for Industrial Pump X-500 (Product ID 1)
INSERT INTO boms (product_id, version, description, status) VALUES 
(1, '1.0', 'Standard Manufacturing BOM for Centrifugal Pump X-500', 'ACTIVE');

-- BOM Items: 1 Pump requires 1 Motor (ID 3), 1 Steel Housing (ID 4), 2 Bearings (ID 5), 8 Hex Bolts (ID 6)
INSERT INTO bom_items (bom_id, material_id, quantity_required, unit) VALUES (1, 3, 1.0000, 'UNIT');
INSERT INTO bom_items (bom_id, material_id, quantity_required, unit) VALUES (1, 4, 1.0000, 'PCS');
INSERT INTO bom_items (bom_id, material_id, quantity_required, unit) VALUES (1, 5, 2.0000, 'PCS');
INSERT INTO bom_items (bom_id, material_id, quantity_required, unit) VALUES (1, 6, 8.0000, 'PCS');

-- BOM for Control Panel CP-100 (Product ID 2)
INSERT INTO boms (product_id, version, description, status) VALUES 
(2, '1.0', 'Standard Electrical BOM for Automation Control Panel CP-100', 'ACTIVE');
INSERT INTO bom_items (bom_id, material_id, quantity_required, unit) VALUES (2, 8, 1.0000, 'SHT');
INSERT INTO bom_items (bom_id, material_id, quantity_required, unit) VALUES (2, 6, 16.0000, 'PCS');

-- SUPPLIERS
INSERT INTO suppliers (name, contact_person, email, phone, address, status) VALUES 
('MetalWorks Supplier Ltd', 'Ramesh Gupta', 'orders@metalworks.in', '+91 98220 33445', '71 Industrial Area Phase 2, Pune', 'ACTIVE');
INSERT INTO suppliers (name, contact_person, email, phone, address, status) VALUES 
('Industrial Components Ltd', 'Kavita Nair', 'sales@indcomp.com', '+91 98451 77889', 'Plot 19 Electronic City, Bengaluru', 'ACTIVE');
INSERT INTO suppliers (name, contact_person, email, phone, address, status) VALUES 
('ElectroParts India', 'Amitabh Roy', 'supply@electroparts.co.in', '+91 98300 44556', '55 Park Street, Kolkata', 'ACTIVE');

-- SALES ORDERS
INSERT INTO sales_orders (order_number, customer_id, order_date, expected_delivery_date, status, subtotal, tax_amount, total_amount, created_by) VALUES 
('SO-1001', 1, CURRENT_TIMESTAMP - 5, CURRENT_DATE + 10, 'IN_PROGRESS', 225000.00, 40500.00, 265500.00, 'Ayush Patel');
INSERT INTO sales_order_items (sales_order_id, product_id, quantity, unit_price, total_price) VALUES 
(1, 1, 5.00, 45000.00, 225000.00);

INSERT INTO sales_orders (order_number, customer_id, order_date, expected_delivery_date, status, subtotal, tax_amount, total_amount, created_by) VALUES 
('SO-1002', 2, CURRENT_TIMESTAMP - 2, CURRENT_DATE + 14, 'CONFIRMED', 128000.00, 23040.00, 151040.00, 'Ayush Patel');
INSERT INTO sales_order_items (sales_order_id, product_id, quantity, unit_price, total_price) VALUES 
(2, 2, 4.00, 32000.00, 128000.00);

INSERT INTO sales_orders (order_number, customer_id, order_date, expected_delivery_date, status, subtotal, tax_amount, total_amount, created_by) VALUES 
('SO-1003', 3, CURRENT_TIMESTAMP - 12, CURRENT_DATE - 2, 'COMPLETED', 135000.00, 24300.00, 159300.00, 'Ayush Patel');
INSERT INTO sales_order_items (sales_order_id, product_id, quantity, unit_price, total_price) VALUES 
(3, 1, 3.00, 45000.00, 135000.00);

-- WORK ORDERS
INSERT INTO work_orders (work_order_number, sales_order_id, product_id, quantity, start_date, expected_end_date, status, assigned_to, progress_percentage, notes) VALUES 
('WO-1001', 1, 1, 5.00, CURRENT_DATE - 3, CURRENT_DATE + 5, 'IN_PROGRESS', 'Vikram Rao', 60.00, 'Main casing assembled, winding and testing in progress');

INSERT INTO work_orders (work_order_number, sales_order_id, product_id, quantity, start_date, expected_end_date, status, assigned_to, progress_percentage, notes) VALUES 
('WO-1002', 2, 2, 4.00, CURRENT_DATE, CURRENT_DATE + 7, 'PLANNED', 'Vikram Rao', 0.00, 'Scheduled for fabrication in Bay 2');

INSERT INTO work_orders (work_order_number, sales_order_id, product_id, quantity, start_date, expected_end_date, actual_end_date, status, assigned_to, progress_percentage, notes) VALUES 
('WO-1000', 3, 1, 3.00, CURRENT_DATE - 10, CURRENT_DATE - 3, CURRENT_DATE - 3, 'COMPLETED', 'Vikram Rao', 100.00, 'Completed QA testing and packaged');

-- PURCHASE ORDERS
INSERT INTO purchase_orders (purchase_order_number, supplier_id, order_date, expected_delivery_date, status, total_amount, created_by, approved_by) VALUES 
('PO-2001', 2, CURRENT_TIMESTAMP - 3, CURRENT_DATE + 4, 'ORDERED', 22500.00, 'Sunita Sharma', 'System Administrator');
INSERT INTO purchase_order_items (purchase_order_id, material_id, quantity, received_quantity, unit_price, total_price) VALUES 
(1, 5, 50.00, 0.00, 450.00, 22500.00);

INSERT INTO purchase_orders (purchase_order_number, supplier_id, order_date, expected_delivery_date, status, total_amount, created_by, approved_by) VALUES 
('PO-2002', 3, CURRENT_TIMESTAMP - 1, CURRENT_DATE + 6, 'SUBMITTED', 18400.00, 'Sunita Sharma', NULL);
INSERT INTO purchase_order_items (purchase_order_id, material_id, quantity, received_quantity, unit_price, total_price) VALUES 
(2, 7, 20.00, 0.00, 920.00, 18400.00);

-- INVOICES
INSERT INTO invoices (invoice_number, sales_order_id, customer_id, invoice_date, due_date, subtotal, tax, total_amount, paid_amount, status) VALUES 
('INV-5001', 3, 3, CURRENT_DATE - 2, CURRENT_DATE + 28, 135000.00, 24300.00, 159300.00, 159300.00, 'PAID');

INSERT INTO invoices (invoice_number, sales_order_id, customer_id, invoice_date, due_date, subtotal, tax, total_amount, paid_amount, status) VALUES 
('INV-5002', 1, 1, CURRENT_DATE, CURRENT_DATE + 30, 225000.00, 40500.00, 265500.00, 100000.00, 'PARTIALLY_PAID');

-- PAYMENTS
INSERT INTO payments (payment_reference, invoice_id, payment_date, amount, payment_method, transaction_reference, status, notes, recorded_by) VALUES 
('PAY-9001', 1, CURRENT_TIMESTAMP - 1, 159300.00, 'BANK_TRANSFER', 'NEFT-HDFC-99882233', 'COMPLETED', 'Full settlement for SO-1003', 'Rajesh Verma');

INSERT INTO payments (payment_reference, invoice_id, payment_date, amount, payment_method, transaction_reference, status, notes, recorded_by) VALUES 
('PAY-9002', 2, CURRENT_TIMESTAMP, 100000.00, 'BANK_TRANSFER', 'RTGS-ICICI-44551122', 'COMPLETED', 'Advance tranche payment for SO-1001', 'Rajesh Verma');

-- NOTIFICATIONS
INSERT INTO notifications (title, message, type, target_role, is_read) VALUES 
('Low Stock Alert', 'Material Deep Groove Ball Bearing 6205 is below reorder level (8 remaining, threshold 20).', 'WARNING', 'PROCUREMENT_OFFICER', 0);
INSERT INTO notifications (title, message, type, target_role, is_read) VALUES 
('Sales Order Confirmed', 'Sales Order SO-1002 has been confirmed by Ayush Patel.', 'SUCCESS', 'PRODUCTION_MANAGER', 0);
INSERT INTO notifications (title, message, type, target_role, is_read) VALUES 
('Work Order In Progress', 'Work Order WO-1001 is 60% complete in Bay 1.', 'INFO', 'PRODUCTION_MANAGER', 0);
INSERT INTO notifications (title, message, type, target_role, is_read) VALUES 
('Partial Payment Recorded', 'Received ₹1,00,000 against Invoice INV-5002 from ABC Manufacturing Pvt Ltd.', 'SUCCESS', 'FINANCE_OFFICER', 0);

-- AUDIT LOGS
INSERT INTO audit_logs (username, action, entity_type, entity_id, old_value, new_value, ip_address) VALUES 
('sales@ordercraft.com', 'ORDER_CREATED', 'SalesOrder', 'SO-1001', NULL, 'Status: DRAFT, Total: ₹265,500', '192.168.1.104');
INSERT INTO audit_logs (username, action, entity_type, entity_id, old_value, new_value, ip_address) VALUES 
('sales@ordercraft.com', 'ORDER_CONFIRMED', 'SalesOrder', 'SO-1001', 'DRAFT', 'IN_PROGRESS', '192.168.1.104');
INSERT INTO audit_logs (username, action, entity_type, entity_id, old_value, new_value, ip_address) VALUES 
('production@ordercraft.com', 'WORK_ORDER_STARTED', 'WorkOrder', 'WO-1001', 'PLANNED', 'IN_PROGRESS', '192.168.1.108');
INSERT INTO audit_logs (username, action, entity_type, entity_id, old_value, new_value, ip_address) VALUES 
('finance@ordercraft.com', 'PAYMENT_RECEIVED', 'Payment', 'PAY-9002', 'Balance: ₹265,500', 'Paid: ₹100,000, Remaining: ₹165,500', '192.168.1.112');
