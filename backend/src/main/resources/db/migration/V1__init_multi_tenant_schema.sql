-- =====================================================================
-- ORDERCRAFT V1: Multi-Tenant Manufacturing OMS DDL Schema
-- Dialect: MySQL 8.0 (InnoDB, utf8mb4, utf8mb4_0900_ai_ci)
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Tenant Master
CREATE TABLE IF NOT EXISTS `tenant` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `public_id` CHAR(36) NOT NULL UNIQUE,
    `code` VARCHAR(50) NOT NULL UNIQUE,
    `name` VARCHAR(150) NOT NULL,
    `plan` VARCHAR(50) NOT NULL DEFAULT 'ENTERPRISE',
    `status` VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    `timezone` VARCHAR(50) NOT NULL DEFAULT 'UTC',
    `currency` CHAR(3) NOT NULL DEFAULT 'INR',
    `settings_json` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `version` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    CONSTRAINT `chk_tenant_status` CHECK (`status` IN ('ACTIVE', 'SUSPENDED', 'ONBOARDING', 'OFFBOARDED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2. App User
CREATE TABLE IF NOT EXISTS `app_user` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `public_id` CHAR(36) NOT NULL UNIQUE,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    `failed_attempts` INT UNSIGNED NOT NULL DEFAULT 0,
    `locked_until` DATETIME(3) NULL,
    `mfa_secret` VARCHAR(100) NULL,
    `mfa_enabled` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `version` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    UNIQUE KEY `uk_tenant_user_email` (`tenant_id`, `email`),
    KEY `idx_app_user_tenant_status` (`tenant_id`, `status`),
    CONSTRAINT `fk_app_user_tenant` FOREIGN KEY (`tenant_id`) REFERENCES `tenant` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `chk_user_status` CHECK (`status` IN ('ACTIVE', 'LOCKED', 'DEACTIVATED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 3. Roles and Permissions
CREATE TABLE IF NOT EXISTS `role` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` BIGINT UNSIGNED NULL, -- NULL indicates global system role
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NULL,
    `is_system` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE KEY `uk_tenant_role_code` (`tenant_id`, `code`),
    KEY `idx_role_tenant` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `permission` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(80) NOT NULL UNIQUE,
    `module` VARCHAR(50) NOT NULL,
    `description` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `role_permission` (
    `role_id` BIGINT UNSIGNED NOT NULL,
    `permission_id` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`role_id`, `permission_id`),
    CONSTRAINT `fk_rp_role` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_rp_permission` FOREIGN KEY (`permission_id`) REFERENCES `permission` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `user_role` (
    `user_id` BIGINT UNSIGNED NOT NULL,
    `role_id` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`user_id`, `role_id`),
    CONSTRAINT `fk_ur_user` FOREIGN KEY (`user_id`) REFERENCES `app_user` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ur_role` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 4. Refresh Token with Rotation & Reuse Detection
CREATE TABLE IF NOT EXISTS `refresh_token` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `token_hash` VARCHAR(64) NOT NULL UNIQUE,
    `family_id` CHAR(36) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,
    `replaced_by` VARCHAR(64) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    KEY `idx_refresh_user` (`user_id`),
    KEY `idx_refresh_family` (`family_id`),
    CONSTRAINT `fk_refresh_token_user` FOREIGN KEY (`user_id`) REFERENCES `app_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 5. Master Data: UoM & Warehouse
CREATE TABLE IF NOT EXISTS `uom` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `name` VARCHAR(50) NOT NULL,
    `description` VARCHAR(100) NULL,
    UNIQUE KEY `uk_tenant_uom_code` (`tenant_id`, `code`),
    KEY `idx_uom_tenant` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `uom_conversion` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `from_uom_id` BIGINT UNSIGNED NOT NULL,
    `to_uom_id` BIGINT UNSIGNED NOT NULL,
    `multiplier` DECIMAL(19,4) NOT NULL,
    UNIQUE KEY `uk_tenant_uom_conv` (`tenant_id`, `from_uom_id`, `to_uom_id`),
    CONSTRAINT `fk_uom_conv_from` FOREIGN KEY (`from_uom_id`) REFERENCES `uom` (`id`),
    CONSTRAINT `fk_uom_conv_to` FOREIGN KEY (`to_uom_id`) REFERENCES `uom` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `warehouse` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `public_id` CHAR(36) NOT NULL UNIQUE,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `address` VARCHAR(255) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE KEY `uk_tenant_warehouse_code` (`tenant_id`, `code`),
    KEY `idx_warehouse_tenant` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 6. Master Data: Customer & Supplier
CREATE TABLE IF NOT EXISTS `customer` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `public_id` CHAR(36) NOT NULL UNIQUE,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(150) NULL,
    `phone` VARCHAR(50) NULL,
    `tax_id` VARCHAR(50) NULL, -- GSTIN / VAT ID
    `credit_limit` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `payment_terms_days` INT UNSIGNED NOT NULL DEFAULT 30,
    `status` VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `version` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    UNIQUE KEY `uk_tenant_customer_code` (`tenant_id`, `code`),
    KEY `idx_customer_tenant_status` (`tenant_id`, `status`),
    CONSTRAINT `chk_customer_status` CHECK (`status` IN ('ACTIVE', 'INACTIVE', 'BLOCKED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `customer_address` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `customer_id` BIGINT UNSIGNED NOT NULL,
    `address_type` VARCHAR(30) NOT NULL, -- BILLING / SHIPPING
    `address_line1` VARCHAR(255) NOT NULL,
    `address_line2` VARCHAR(255) NULL,
    `city` VARCHAR(100) NOT NULL,
    `state` VARCHAR(100) NOT NULL,
    `postal_code` VARCHAR(20) NOT NULL,
    `country` VARCHAR(100) NOT NULL DEFAULT 'India',
    `is_default` BOOLEAN NOT NULL DEFAULT FALSE,
    KEY `idx_cust_addr_customer` (`customer_id`),
    CONSTRAINT `fk_cust_addr_cust` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `supplier` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `public_id` CHAR(36) NOT NULL UNIQUE,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `contact_person` VARCHAR(100) NULL,
    `email` VARCHAR(150) NULL,
    `phone` VARCHAR(50) NULL,
    `address` VARCHAR(255) NULL,
    `tax_id` VARCHAR(50) NULL,
    `rating` DECIMAL(3,2) NOT NULL DEFAULT 5.00,
    `lead_time_days` INT UNSIGNED NOT NULL DEFAULT 7,
    `status` VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `version` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    UNIQUE KEY `uk_tenant_supplier_code` (`tenant_id`, `code`),
    KEY `idx_supplier_tenant` (`tenant_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 7. Product Master & Price Lists
CREATE TABLE IF NOT EXISTS `product` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `public_id` CHAR(36) NOT NULL UNIQUE,
    `sku` VARCHAR(80) NOT NULL,
    `name` VARCHAR(180) NOT NULL,
    `type` VARCHAR(30) NOT NULL, -- RAW, SEMI, FINISHED
    `uom_id` BIGINT UNSIGNED NOT NULL,
    `tax_rate` DECIMAL(9,4) NOT NULL DEFAULT 18.0000, -- GST rate %
    `standard_cost` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `selling_price` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `reorder_level` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `status` VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    `deleted_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `version` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    UNIQUE KEY `uk_tenant_product_sku` (`tenant_id`, `sku`),
    KEY `idx_product_tenant_type` (`tenant_id`, `type`, `status`),
    CONSTRAINT `fk_product_uom` FOREIGN KEY (`uom_id`) REFERENCES `uom` (`id`),
    CONSTRAINT `chk_product_type` CHECK (`type` IN ('RAW', 'SEMI', 'FINISHED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `price_list` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `effective_from` DATE NOT NULL,
    `effective_to` DATE NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE KEY `uk_tenant_pricelist_code` (`tenant_id`, `code`),
    KEY `idx_pricelist_tenant` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `price_list_item` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `price_list_id` BIGINT UNSIGNED NOT NULL,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `price` DECIMAL(19,4) NOT NULL,
    UNIQUE KEY `uk_pricelist_product` (`price_list_id`, `product_id`),
    CONSTRAINT `fk_pli_pricelist` FOREIGN KEY (`price_list_id`) REFERENCES `price_list` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_pli_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 8. Bill of Materials (BOM)
CREATE TABLE IF NOT EXISTS `bom_header` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `public_id` CHAR(36) NOT NULL UNIQUE,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `version_no` VARCHAR(20) NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'DRAFT', -- DRAFT, ACTIVE, OBSOLETE
    `description` VARCHAR(255) NULL,
    `effective_from` DATE NULL,
    `effective_to` DATE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `version` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    UNIQUE KEY `uk_tenant_product_bom_version` (`tenant_id`, `product_id`, `version_no`),
    KEY `idx_bom_tenant_status` (`tenant_id`, `status`),
    CONSTRAINT `fk_bom_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`),
    CONSTRAINT `chk_bom_status` CHECK (`status` IN ('DRAFT', 'ACTIVE', 'OBSOLETE'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `bom_line` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `bom_id` BIGINT UNSIGNED NOT NULL,
    `component_product_id` BIGINT UNSIGNED NOT NULL,
    `qty_per` DECIMAL(19,4) NOT NULL,
    `scrap_pct` DECIMAL(9,4) NOT NULL DEFAULT 0.0000,
    `uom_id` BIGINT UNSIGNED NOT NULL,
    `seq` INT UNSIGNED NOT NULL DEFAULT 1,
    KEY `idx_bom_line_bom` (`bom_id`),
    CONSTRAINT `fk_bom_line_header` FOREIGN KEY (`bom_id`) REFERENCES `bom_header` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_bom_line_component` FOREIGN KEY (`component_product_id`) REFERENCES `product` (`id`),
    CONSTRAINT `fk_bom_line_uom` FOREIGN KEY (`uom_id`) REFERENCES `uom` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 9. Inventory Stock Balance & Append-Only Stock Ledger
CREATE TABLE IF NOT EXISTS `stock_balance` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `warehouse_id` BIGINT UNSIGNED NOT NULL,
    `batch_id` VARCHAR(50) NOT NULL DEFAULT 'DEFAULT',
    `on_hand` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `reserved` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    UNIQUE KEY `uk_tenant_stock_balance` (`tenant_id`, `product_id`, `warehouse_id`, `batch_id`),
    KEY `idx_stock_balance_lookup` (`tenant_id`, `product_id`),
    CONSTRAINT `fk_sb_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`),
    CONSTRAINT `fk_sb_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouse` (`id`),
    CONSTRAINT `chk_sb_non_negative` CHECK (`on_hand` >= 0 AND `reserved` >= 0 AND `reserved` <= `on_hand`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `stock_ledger` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `warehouse_id` BIGINT UNSIGNED NOT NULL,
    `batch_id` VARCHAR(50) NOT NULL DEFAULT 'DEFAULT',
    `movement_type` VARCHAR(30) NOT NULL, -- RECEIPT, RESERVE, RELEASE, CONSUMED, DISPATCH, ADJUSTED
    `qty_delta` DECIMAL(19,4) NOT NULL,
    `unit_cost` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `ref_type` VARCHAR(50) NOT NULL, -- SALES_ORDER, WORK_ORDER, GRN, DELIVERY_NOTE, ADJUSTMENT
    `ref_id` VARCHAR(80) NOT NULL,
    `notes` VARCHAR(255) NULL,
    `created_by` VARCHAR(120) NOT NULL DEFAULT 'SYSTEM',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`, `created_at`),
    KEY `idx_stock_ledger_tenant_prod` (`tenant_id`, `product_id`, `created_at`),
    KEY `idx_stock_ledger_ref` (`tenant_id`, `ref_type`, `ref_id`),
    CONSTRAINT `chk_movement_type` CHECK (`movement_type` IN ('RECEIPT', 'RESERVE', 'RELEASE', 'CONSUMED', 'DISPATCH', 'ADJUSTED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
PARTITION BY RANGE (TO_DAYS(`created_at`)) (
    PARTITION p2026_09 VALUES LESS THAN (TO_DAYS('2026-10-01')),
    PARTITION p2026_10 VALUES LESS THAN (TO_DAYS('2026-11-01')),
    PARTITION p2026_11 VALUES LESS THAN (TO_DAYS('2026-12-01')),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- 10. Stock Reservation (Time-to-Live / Soft Locks)
CREATE TABLE IF NOT EXISTS `stock_reservation` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `order_line_id` BIGINT UNSIGNED NULL,
    `work_order_id` BIGINT UNSIGNED NULL,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `warehouse_id` BIGINT UNSIGNED NOT NULL,
    `batch_id` VARCHAR(50) NOT NULL DEFAULT 'DEFAULT',
    `qty` DECIMAL(19,4) NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, CONSUMED, RELEASED, EXPIRED
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    KEY `idx_res_tenant_prod` (`tenant_id`, `product_id`),
    KEY `idx_res_order_line` (`tenant_id`, `order_line_id`),
    KEY `idx_res_status_expires` (`status`, `expires_at`),
    CONSTRAINT `chk_res_status` CHECK (`status` IN ('ACTIVE', 'CONSUMED', 'RELEASED', 'EXPIRED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 11. Sales Orders & Lifecycle
CREATE TABLE IF NOT EXISTS `sales_order` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `public_id` CHAR(36) NOT NULL UNIQUE,
    `order_no` VARCHAR(60) NOT NULL,
    `customer_id` BIGINT UNSIGNED NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    `order_date` DATE NOT NULL,
    `requested_delivery_date` DATE NOT NULL,
    `promised_delivery_date` DATE NULL,
    `currency` CHAR(3) NOT NULL DEFAULT 'INR',
    `subtotal` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `discount_total` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `tax_total` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `grand_total` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `revision_no` INT UNSIGNED NOT NULL DEFAULT 1,
    `notes` TEXT NULL,
    `created_by` VARCHAR(120) NOT NULL,
    `approved_by` VARCHAR(120) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `version` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    UNIQUE KEY `uk_tenant_order_no` (`tenant_id`, `order_no`),
    KEY `idx_order_tenant_status_date` (`tenant_id`, `status`, `order_date`),
    KEY `idx_order_tenant_customer` (`tenant_id`, `customer_id`, `order_date`),
    CONSTRAINT `fk_so_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`id`),
    CONSTRAINT `chk_so_status` CHECK (`status` IN ('DRAFT', 'SUBMITTED', 'APPROVAL_PENDING', 'APPROVED', 'IN_PRODUCTION', 'READY_TO_SHIP', 'PARTIALLY_SHIPPED', 'SHIPPED', 'INVOICED', 'CLOSED', 'CANCELLED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `sales_order_line` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `order_id` BIGINT UNSIGNED NOT NULL,
    `line_no` INT UNSIGNED NOT NULL,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `qty` DECIMAL(19,4) NOT NULL,
    `uom_id` BIGINT UNSIGNED NOT NULL,
    `unit_price` DECIMAL(19,4) NOT NULL,
    `discount_pct` DECIMAL(9,4) NOT NULL DEFAULT 0.0000,
    `tax_rate` DECIMAL(9,4) NOT NULL DEFAULT 18.0000,
    `line_total` DECIMAL(19,4) NOT NULL,
    `qty_shipped` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `qty_invoiced` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    KEY `idx_sol_order` (`order_id`),
    CONSTRAINT `fk_sol_order` FOREIGN KEY (`order_id`) REFERENCES `sales_order` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_sol_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`),
    CONSTRAINT `fk_sol_uom` FOREIGN KEY (`uom_id`) REFERENCES `uom` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `order_status_history` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `order_id` BIGINT UNSIGNED NOT NULL,
    `from_status` VARCHAR(30) NULL,
    `to_status` VARCHAR(30) NOT NULL,
    `actor_id` VARCHAR(120) NOT NULL,
    `reason` VARCHAR(255) NULL,
    `at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    KEY `idx_osh_order` (`order_id`),
    CONSTRAINT `fk_osh_order` FOREIGN KEY (`order_id`) REFERENCES `sales_order` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 12. Procurement: Purchase Requisitions, POs & Goods Receipt Notes (GRN)
CREATE TABLE IF NOT EXISTS `purchase_requisition` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `public_id` CHAR(36) NOT NULL UNIQUE,
    `req_no` VARCHAR(60) NOT NULL,
    `sales_order_id` BIGINT UNSIGNED NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'DRAFT', -- DRAFT, APPROVED, CONVERTED_TO_PO, REJECTED
    `required_by_date` DATE NOT NULL,
    `created_by` VARCHAR(120) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE KEY `uk_tenant_req_no` (`tenant_id`, `req_no`),
    KEY `idx_pr_tenant_status` (`tenant_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `purchase_requisition_line` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `requisition_id` BIGINT UNSIGNED NOT NULL,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `qty_required` DECIMAL(19,4) NOT NULL,
    `uom_id` BIGINT UNSIGNED NOT NULL,
    `preferred_supplier_id` BIGINT UNSIGNED NULL,
    KEY `idx_prl_req` (`requisition_id`),
    CONSTRAINT `fk_prl_req` FOREIGN KEY (`requisition_id`) REFERENCES `purchase_requisition` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_prl_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`),
    CONSTRAINT `fk_prl_supplier` FOREIGN KEY (`preferred_supplier_id`) REFERENCES `supplier` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `purchase_order` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `public_id` CHAR(36) NOT NULL UNIQUE,
    `po_no` VARCHAR(60) NOT NULL,
    `supplier_id` BIGINT UNSIGNED NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    `order_date` DATE NOT NULL,
    `expected_delivery_date` DATE NOT NULL,
    `subtotal` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `tax_total` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `grand_total` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `created_by` VARCHAR(120) NOT NULL,
    `approved_by` VARCHAR(120) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `version` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    UNIQUE KEY `uk_tenant_po_no` (`tenant_id`, `po_no`),
    KEY `idx_po_tenant_supplier` (`tenant_id`, `supplier_id`, `status`),
    CONSTRAINT `fk_po_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `supplier` (`id`),
    CONSTRAINT `chk_po_status` CHECK (`status` IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CLOSED', 'CANCELLED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `purchase_order_line` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `po_id` BIGINT UNSIGNED NOT NULL,
    `line_no` INT UNSIGNED NOT NULL,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `qty_ordered` DECIMAL(19,4) NOT NULL,
    `qty_received` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `qty_invoiced` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `unit_price` DECIMAL(19,4) NOT NULL,
    `line_total` DECIMAL(19,4) NOT NULL,
    KEY `idx_pol_po` (`po_id`),
    CONSTRAINT `fk_pol_po` FOREIGN KEY (`po_id`) REFERENCES `purchase_order` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_pol_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `goods_receipt` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `public_id` CHAR(36) NOT NULL UNIQUE,
    `grn_no` VARCHAR(60) NOT NULL,
    `po_id` BIGINT UNSIGNED NOT NULL,
    `supplier_id` BIGINT UNSIGNED NOT NULL,
    `warehouse_id` BIGINT UNSIGNED NOT NULL,
    `receipt_date` DATE NOT NULL,
    `delivery_challan_no` VARCHAR(80) NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'COMPLETED', -- COMPLETED, CANCELLED
    `qc_status` VARCHAR(30) NOT NULL DEFAULT 'PASSED', -- PASSED, REJECTED, PARTIAL
    `received_by` VARCHAR(120) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE KEY `uk_tenant_grn_no` (`tenant_id`, `grn_no`),
    KEY `idx_grn_po` (`tenant_id`, `po_id`),
    CONSTRAINT `fk_grn_po` FOREIGN KEY (`po_id`) REFERENCES `purchase_order` (`id`),
    CONSTRAINT `fk_grn_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `supplier` (`id`),
    CONSTRAINT `fk_grn_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouse` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `goods_receipt_line` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `grn_id` BIGINT UNSIGNED NOT NULL,
    `po_line_id` BIGINT UNSIGNED NOT NULL,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `qty_received` DECIMAL(19,4) NOT NULL,
    `qty_accepted` DECIMAL(19,4) NOT NULL,
    `qty_rejected` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `unit_cost` DECIMAL(19,4) NOT NULL,
    `batch_id` VARCHAR(50) NOT NULL DEFAULT 'DEFAULT',
    KEY `idx_grnl_grn` (`grn_id`),
    CONSTRAINT `fk_grnl_grn` FOREIGN KEY (`grn_id`) REFERENCES `goods_receipt` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_grnl_pol` FOREIGN KEY (`po_line_id`) REFERENCES `purchase_order_line` (`id`),
    CONSTRAINT `fk_grnl_prod` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 13. Production: Work Orders, Stages & Material Issues
CREATE TABLE IF NOT EXISTS `work_order` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `public_id` CHAR(36) NOT NULL UNIQUE,
    `wo_no` VARCHAR(60) NOT NULL,
    `sales_order_line_id` BIGINT UNSIGNED NULL,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `bom_id` BIGINT UNSIGNED NOT NULL,
    `qty_planned` DECIMAL(19,4) NOT NULL,
    `qty_completed` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `qty_scrapped` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `status` VARCHAR(30) NOT NULL DEFAULT 'PLANNED',
    `planned_start` DATE NOT NULL,
    `planned_end` DATE NOT NULL,
    `actual_start` DATETIME(3) NULL,
    `actual_end` DATETIME(3) NULL,
    `assigned_lead` VARCHAR(120) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `version` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    UNIQUE KEY `uk_tenant_wo_no` (`tenant_id`, `wo_no`),
    KEY `idx_wo_tenant_status` (`tenant_id`, `status`),
    CONSTRAINT `fk_wo_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`),
    CONSTRAINT `fk_wo_bom` FOREIGN KEY (`bom_id`) REFERENCES `bom_header` (`id`),
    CONSTRAINT `chk_wo_status` CHECK (`status` IN ('PLANNED', 'RELEASED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `work_order_stage` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `work_order_id` BIGINT UNSIGNED NOT NULL,
    `stage_name` VARCHAR(80) NOT NULL,
    `seq` INT UNSIGNED NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    `completed_qty` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    KEY `idx_wos_wo` (`work_order_id`),
    CONSTRAINT `fk_wos_wo` FOREIGN KEY (`work_order_id`) REFERENCES `work_order` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `work_order_material_issue` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `work_order_id` BIGINT UNSIGNED NOT NULL,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `warehouse_id` BIGINT UNSIGNED NOT NULL,
    `qty_required` DECIMAL(19,4) NOT NULL,
    `qty_issued` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `issued_at` DATETIME(3) NULL,
    KEY `idx_womi_wo` (`work_order_id`),
    CONSTRAINT `fk_womi_wo` FOREIGN KEY (`work_order_id`) REFERENCES `work_order` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_womi_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`),
    CONSTRAINT `fk_womi_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouse` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 14. Dispatch & Delivery Notes
CREATE TABLE IF NOT EXISTS `delivery_note` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `public_id` CHAR(36) NOT NULL UNIQUE,
    `dn_no` VARCHAR(60) NOT NULL,
    `sales_order_id` BIGINT UNSIGNED NOT NULL,
    `customer_id` BIGINT UNSIGNED NOT NULL,
    `dispatch_date` DATE NOT NULL,
    `transporter_name` VARCHAR(100) NULL,
    `tracking_no` VARCHAR(100) NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'DISPATCHED', -- DRAFT, DISPATCHED, DELIVERED, CANCELLED
    `dispatched_by` VARCHAR(120) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE KEY `uk_tenant_dn_no` (`tenant_id`, `dn_no`),
    KEY `idx_dn_order` (`tenant_id`, `sales_order_id`),
    CONSTRAINT `fk_dn_so` FOREIGN KEY (`sales_order_id`) REFERENCES `sales_order` (`id`),
    CONSTRAINT `fk_dn_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `delivery_note_line` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `delivery_note_id` BIGINT UNSIGNED NOT NULL,
    `order_line_id` BIGINT UNSIGNED NOT NULL,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `qty_dispatched` DECIMAL(19,4) NOT NULL,
    KEY `idx_dnl_dn` (`delivery_note_id`),
    CONSTRAINT `fk_dnl_dn` FOREIGN KEY (`delivery_note_id`) REFERENCES `delivery_note` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_dnl_ol` FOREIGN KEY (`order_line_id`) REFERENCES `sales_order_line` (`id`),
    CONSTRAINT `fk_dnl_prod` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 15. Invoicing & Credit Notes
CREATE TABLE IF NOT EXISTS `invoice` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `public_id` CHAR(36) NOT NULL UNIQUE,
    `invoice_no` VARCHAR(60) NOT NULL,
    `customer_id` BIGINT UNSIGNED NOT NULL,
    `order_id` BIGINT UNSIGNED NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    `issue_date` DATE NOT NULL,
    `due_date` DATE NOT NULL,
    `currency` CHAR(3) NOT NULL DEFAULT 'INR',
    `subtotal` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `tax_total` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `grand_total` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `amount_paid` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `balance` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `pdf_s3_key` VARCHAR(255) NULL,
    `created_by` VARCHAR(120) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    `version` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    UNIQUE KEY `uk_tenant_invoice_no` (`tenant_id`, `invoice_no`),
    KEY `idx_inv_tenant_status_due` (`tenant_id`, `status`, `due_date`),
    KEY `idx_inv_customer` (`tenant_id`, `customer_id`),
    CONSTRAINT `fk_inv_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`id`),
    CONSTRAINT `fk_inv_order` FOREIGN KEY (`order_id`) REFERENCES `sales_order` (`id`),
    CONSTRAINT `chk_inv_status` CHECK (`status` IN ('DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED')),
    CONSTRAINT `chk_inv_balance` CHECK (`amount_paid` >= 0 AND `balance` >= 0 AND `amount_paid` + `balance` = `grand_total`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `invoice_line` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `invoice_id` BIGINT UNSIGNED NOT NULL,
    `order_line_id` BIGINT UNSIGNED NOT NULL,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `qty` DECIMAL(19,4) NOT NULL,
    `unit_price` DECIMAL(19,4) NOT NULL,
    `tax_rate` DECIMAL(9,4) NOT NULL,
    `tax_amount` DECIMAL(19,4) NOT NULL,
    `line_total` DECIMAL(19,4) NOT NULL,
    KEY `idx_invl_inv` (`invoice_id`),
    CONSTRAINT `fk_invl_inv` FOREIGN KEY (`invoice_id`) REFERENCES `invoice` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_invl_ol` FOREIGN KEY (`order_line_id`) REFERENCES `sales_order_line` (`id`),
    CONSTRAINT `fk_invl_prod` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `credit_note` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `public_id` CHAR(36) NOT NULL UNIQUE,
    `cn_no` VARCHAR(60) NOT NULL,
    `invoice_id` BIGINT UNSIGNED NOT NULL,
    `customer_id` BIGINT UNSIGNED NOT NULL,
    `reason` VARCHAR(255) NOT NULL,
    `amount` DECIMAL(19,4) NOT NULL,
    `created_by` VARCHAR(120) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE KEY `uk_tenant_cn_no` (`tenant_id`, `cn_no`),
    CONSTRAINT `fk_cn_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoice` (`id`),
    CONSTRAINT `fk_cn_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 16. Payments & Settlements
CREATE TABLE IF NOT EXISTS `payment` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `public_id` CHAR(36) NOT NULL UNIQUE,
    `payment_ref` VARCHAR(80) NOT NULL,
    `customer_id` BIGINT UNSIGNED NOT NULL,
    `amount` DECIMAL(19,4) NOT NULL,
    `method` VARCHAR(30) NOT NULL, -- BANK_TRANSFER, CHEQUE, CASH, CARD, UPI
    `transaction_reference` VARCHAR(100) NULL,
    `received_at` DATETIME(3) NOT NULL,
    `unallocated_amount` DECIMAL(19,4) NOT NULL DEFAULT 0.0000,
    `notes` VARCHAR(255) NULL,
    `created_by` VARCHAR(120) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE KEY `uk_tenant_payment_ref` (`tenant_id`, `payment_ref`),
    KEY `idx_payment_tenant_cust` (`tenant_id`, `customer_id`),
    CONSTRAINT `fk_pay_customer` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`id`),
    CONSTRAINT `chk_pay_amount` CHECK (`amount` > 0 AND `unallocated_amount` >= 0 AND `unallocated_amount` <= `amount`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `payment_allocation` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `payment_id` BIGINT UNSIGNED NOT NULL,
    `invoice_id` BIGINT UNSIGNED NOT NULL,
    `amount` DECIMAL(19,4) NOT NULL,
    `allocated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    KEY `idx_pa_payment` (`payment_id`),
    KEY `idx_pa_invoice` (`invoice_id`),
    CONSTRAINT `fk_pa_payment` FOREIGN KEY (`payment_id`) REFERENCES `payment` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_pa_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoice` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 17. Gap-Free Document Sequence (Pessimistic Locking)
CREATE TABLE IF NOT EXISTS `document_sequence` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `doc_type` VARCHAR(50) NOT NULL, -- ORDER, INVOICE, PO, WO, GRN, DN, CN
    `fiscal_year` VARCHAR(10) NOT NULL, -- e.g. FY2026-27
    `next_value` BIGINT UNSIGNED NOT NULL DEFAULT 1,
    `prefix` VARCHAR(20) NOT NULL DEFAULT '',
    `padding` INT UNSIGNED NOT NULL DEFAULT 5,
    UNIQUE KEY `uk_tenant_doc_seq` (`tenant_id`, `doc_type`, `fiscal_year`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 18. Audit Log (Append-Only, Partitioned)
CREATE TABLE IF NOT EXISTS `audit_log` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `actor_id` VARCHAR(120) NOT NULL,
    `entity_type` VARCHAR(60) NOT NULL,
    `entity_id` VARCHAR(80) NOT NULL,
    `action` VARCHAR(60) NOT NULL,
    `old_json` JSON NULL,
    `new_json` JSON NULL,
    `ip_address` VARCHAR(50) NULL,
    `at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`, `at`),
    KEY `idx_audit_tenant_at` (`tenant_id`, `at`),
    KEY `idx_audit_entity` (`tenant_id`, `entity_type`, `entity_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
PARTITION BY RANGE (TO_DAYS(`at`)) (
    PARTITION p2026_09 VALUES LESS THAN (TO_DAYS('2026-10-01')),
    PARTITION p2026_10 VALUES LESS THAN (TO_DAYS('2026-11-01')),
    PARTITION p2026_11 VALUES LESS THAN (TO_DAYS('2026-12-01')),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);

-- 19. Transactional Outbox Pattern
CREATE TABLE IF NOT EXISTS `outbox_event` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `aggregate_type` VARCHAR(80) NOT NULL,
    `aggregate_id` VARCHAR(80) NOT NULL,
    `event_type` VARCHAR(80) NOT NULL,
    `payload_json` JSON NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, PUBLISHED, FAILED
    `attempts` INT UNSIGNED NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `published_at` DATETIME(3) NULL,
    KEY `idx_outbox_status_attempts` (`status`, `attempts`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 20. Notification Store
CREATE TABLE IF NOT EXISTS `notification` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `user_id` BIGINT UNSIGNED NULL, -- NULL means broadcast to role
    `target_role` VARCHAR(50) NULL,
    `channel` VARCHAR(30) NOT NULL DEFAULT 'IN_APP',
    `template` VARCHAR(80) NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `payload_json` JSON NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'UNREAD',
    `read_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    KEY `idx_notif_tenant_user` (`tenant_id`, `user_id`, `status`),
    KEY `idx_notif_tenant_role` (`tenant_id`, `target_role`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 21. Idempotency Key Store
CREATE TABLE IF NOT EXISTS `idempotency_key` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` BIGINT UNSIGNED NOT NULL,
    `key_value` VARCHAR(120) NOT NULL,
    `request_hash` VARCHAR(64) NOT NULL,
    `response_json` JSON NULL,
    `status_code` INT UNSIGNED NOT NULL DEFAULT 200,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE KEY `uk_tenant_idem_key` (`tenant_id`, `key_value`),
    KEY `idx_idem_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 22. ShedLock Table for Distributed Scheduler
CREATE TABLE IF NOT EXISTS `shedlock` (
    `name` VARCHAR(64) NOT NULL PRIMARY KEY,
    `lock_until` TIMESTAMP(3) NOT NULL,
    `locked_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `locked_by` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET FOREIGN_KEY_CHECKS = 1;
