package com.ordercraft.config;

import com.ordercraft.entity.*;
import com.ordercraft.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final BomRepository bomRepository;
    private final InventoryRepository inventoryRepository;
    private final SupplierRepository supplierRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final WorkOrderRepository workOrderRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final NotificationRepository notificationRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (roleRepository.count() > 0) {
            log.info("Database already initialized. Skipping seeding.");
            return;
        }

        log.info("Bootstrapping ORDERCRAFT initial enterprise master data...");

        // 1. Roles
        Role adminRole = roleRepository.save(Role.builder().name("ADMIN").description("Full system administrator").build());
        Role salesRole = roleRepository.save(Role.builder().name("SALES").description("Sales executive").build());
        Role prodRole = roleRepository.save(Role.builder().name("PRODUCTION_MANAGER").description("Production manager").build());
        Role procRole = roleRepository.save(Role.builder().name("PROCUREMENT_OFFICER").description("Procurement officer").build());
        Role finRole = roleRepository.save(Role.builder().name("FINANCE_OFFICER").description("Finance officer").build());

        // 2. Users (Password: Password@123)
        String hash = passwordEncoder.encode("Password@123");

        userRepository.save(User.builder().name("System Administrator").email("admin@ordercraft.com")
                .passwordHash(hash).isActive(true).roles(new HashSet<>(Collections.singletonList(adminRole))).build());

        userRepository.save(User.builder().name("Ayush Patel (Sales)").email("sales@ordercraft.com")
                .passwordHash(hash).isActive(true).roles(new HashSet<>(Collections.singletonList(salesRole))).build());

        userRepository.save(User.builder().name("Vikram Rao (Production)").email("production@ordercraft.com")
                .passwordHash(hash).isActive(true).roles(new HashSet<>(Collections.singletonList(prodRole))).build());

        userRepository.save(User.builder().name("Sunita Sharma (Procurement)").email("procurement@ordercraft.com")
                .passwordHash(hash).isActive(true).roles(new HashSet<>(Collections.singletonList(procRole))).build());

        userRepository.save(User.builder().name("Rajesh Verma (Finance)").email("finance@ordercraft.com")
                .passwordHash(hash).isActive(true).roles(new HashSet<>(Collections.singletonList(finRole))).build());

        // 3. Customers
        Customer c1 = customerRepository.save(Customer.builder().name("ABC Manufacturing Pvt Ltd").email("procurement@abcmfg.com")
                .phone("+91 98201 12345").address("Plot 42, MIDC Industrial Area").city("Pune").state("Maharashtra").postalCode("411018").status("ACTIVE").build());

        Customer c2 = customerRepository.save(Customer.builder().name("Techno Industries").email("orders@technoind.com")
                .phone("+91 98450 54321").address("88 Peenya Industrial Estate").city("Bengaluru").state("Karnataka").postalCode("560058").status("ACTIVE").build());

        Customer c3 = customerRepository.save(Customer.builder().name("Global Engineering Ltd").email("contact@globaleng.com")
                .phone("+91 99100 87654").address("B-12 Sector 63").city("Noida").state("Uttar Pradesh").postalCode("201301").status("ACTIVE").build());

        Customer c4 = customerRepository.save(Customer.builder().name("Apex Automotive Corp").email("supplychain@apexauto.in")
                .phone("+91 97234 11223").address("Sanand Industrial Park").city("Ahmedabad").state("Gujarat").postalCode("382170").status("ACTIVE").build());

        // 4. Products: Finished Goods & Raw Materials
        Product fg1 = productRepository.save(Product.builder().name("Industrial Pump X-500").sku("FG-PUMP-500")
                .description("Heavy-duty 5HP high-pressure centrifugal water pump").unitPrice(BigDecimal.valueOf(45000))
                .unit("UNIT").category(Product.Category.FINISHED_GOOD).status("ACTIVE").build());

        Product fg2 = productRepository.save(Product.builder().name("Control Panel CP-100").sku("FG-CTRL-100")
                .description("Automated programmable logic control panel with IP65 enclosure").unitPrice(BigDecimal.valueOf(32000))
                .unit("UNIT").category(Product.Category.FINISHED_GOOD).status("ACTIVE").build());

        Product rmMotor = productRepository.save(Product.builder().name("Industrial Motor 5HP").sku("FG-MTR-05")
                .description("Three-phase 415V 1440RPM induction electric motor").unitPrice(BigDecimal.valueOf(18500))
                .unit("UNIT").category(Product.Category.SUB_ASSEMBLY).status("ACTIVE").build());

        Product rmHousing = productRepository.save(Product.builder().name("Steel Housing Shell").sku("RM-STL-HSG")
                .description("Cast iron precision machined outer pump housing").unitPrice(BigDecimal.valueOf(8500))
                .unit("PCS").category(Product.Category.RAW_MATERIAL).status("ACTIVE").build());

        Product rmBearing = productRepository.save(Product.builder().name("Deep Groove Ball Bearing 6205").sku("RM-BRG-6205")
                .description("High-speed chrome steel double sealed ball bearing").unitPrice(BigDecimal.valueOf(450))
                .unit("PCS").category(Product.Category.RAW_MATERIAL).status("ACTIVE").build());

        Product rmScrew = productRepository.save(Product.builder().name("Stainless Hex Bolt M8x30").sku("RM-SCR-M8")
                .description("Grade 304 stainless steel metric hex fastener bolt").unitPrice(BigDecimal.valueOf(15))
                .unit("PCS").category(Product.Category.RAW_MATERIAL).status("ACTIVE").build());

        Product rmCopper = productRepository.save(Product.builder().name("Copper Enamelled Winding Wire").sku("RM-CPR-WRE")
                .description("Super enamelled Grade 2 copper winding wire spool").unitPrice(BigDecimal.valueOf(920))
                .unit("KG").category(Product.Category.RAW_MATERIAL).status("ACTIVE").build());

        Product rmSteelSheet = productRepository.save(Product.builder().name("Cold Rolled Steel Sheet 2mm").sku("RM-STL-SHT")
                .description("2mm CRCA steel sheet 8x4 ft panel").unitPrice(BigDecimal.valueOf(3400))
                .unit("SHT").category(Product.Category.RAW_MATERIAL).status("ACTIVE").build());

        // 5. Inventory
        saveInventory(fg1, 15, 5, 5, "Warehouse A - Bay 1");
        saveInventory(fg2, 8, 2, 3, "Warehouse A - Bay 2");
        saveInventory(rmMotor, 24, 6, 8, "Warehouse B - Rack 3");
        saveInventory(rmHousing, 30, 10, 15, "Warehouse B - Bin 12");
        saveInventory(rmBearing, 8, 2, 20, "Warehouse C - Bin 4"); // Low stock
        saveInventory(rmScrew, 120, 40, 50, "Warehouse C - Bin 5");
        saveInventory(rmCopper, 4, 0, 15, "Warehouse C - Bin 8"); // Low stock
        saveInventory(rmSteelSheet, 45, 12, 10, "Warehouse A - Sheet Yard");

        // 6. BOM
        Bom pumpBom = Bom.builder().product(fg1).version("1.0")
                .description("Standard Manufacturing BOM for Centrifugal Pump X-500").status("ACTIVE").build();
        pumpBom.addItem(BomItem.builder().bom(pumpBom).material(rmMotor).quantityRequired(BigDecimal.valueOf(1)).unit("UNIT").build());
        pumpBom.addItem(BomItem.builder().bom(pumpBom).material(rmHousing).quantityRequired(BigDecimal.valueOf(1)).unit("PCS").build());
        pumpBom.addItem(BomItem.builder().bom(pumpBom).material(rmBearing).quantityRequired(BigDecimal.valueOf(2)).unit("PCS").build());
        pumpBom.addItem(BomItem.builder().bom(pumpBom).material(rmScrew).quantityRequired(BigDecimal.valueOf(8)).unit("PCS").build());
        bomRepository.save(pumpBom);

        Bom panelBom = Bom.builder().product(fg2).version("1.0")
                .description("Standard Electrical BOM for Automation Control Panel CP-100").status("ACTIVE").build();
        panelBom.addItem(BomItem.builder().bom(panelBom).material(rmSteelSheet).quantityRequired(BigDecimal.valueOf(1)).unit("SHT").build());
        panelBom.addItem(BomItem.builder().bom(panelBom).material(rmScrew).quantityRequired(BigDecimal.valueOf(16)).unit("PCS").build());
        bomRepository.save(panelBom);

        // 7. Suppliers
        Supplier s1 = supplierRepository.save(Supplier.builder().name("MetalWorks Supplier Ltd")
                .contactPerson("Ramesh Gupta").email("orders@metalworks.in").phone("+91 98220 33445")
                .address("71 Industrial Area Phase 2, Pune").status("ACTIVE").build());

        Supplier s2 = supplierRepository.save(Supplier.builder().name("Industrial Components Ltd")
                .contactPerson("Kavita Nair").email("sales@indcomp.com").phone("+91 98451 77889")
                .address("Plot 19 Electronic City, Bengaluru").status("ACTIVE").build());

        Supplier s3 = supplierRepository.save(Supplier.builder().name("ElectroParts India")
                .contactPerson("Amitabh Roy").email("supply@electroparts.co.in").phone("+91 98300 44556")
                .address("55 Park Street, Kolkata").status("ACTIVE").build());

        // 8. Sales Orders
        SalesOrder so1 = SalesOrder.builder().orderNumber("SO-1001").customer(c1)
                .orderDate(LocalDateTime.now().minusDays(5)).expectedDeliveryDate(LocalDate.now().plusDays(10))
                .status(SalesOrder.OrderStatus.IN_PROGRESS).createdBy("Ayush Patel").build();
        SalesOrderItem so1Item = SalesOrderItem.builder().salesOrder(so1).product(fg1)
                .quantity(BigDecimal.valueOf(5)).unitPrice(BigDecimal.valueOf(45000)).build();
        so1Item.calculateTotal();
        so1.addItem(so1Item);
        so1.recalculateTotals();
        salesOrderRepository.save(so1);

        SalesOrder so2 = SalesOrder.builder().orderNumber("SO-1002").customer(c2)
                .orderDate(LocalDateTime.now().minusDays(2)).expectedDeliveryDate(LocalDate.now().plusDays(14))
                .status(SalesOrder.OrderStatus.CONFIRMED).createdBy("Ayush Patel").build();
        SalesOrderItem so2Item = SalesOrderItem.builder().salesOrder(so2).product(fg2)
                .quantity(BigDecimal.valueOf(4)).unitPrice(BigDecimal.valueOf(32000)).build();
        so2Item.calculateTotal();
        so2.addItem(so2Item);
        so2.recalculateTotals();
        salesOrderRepository.save(so2);

        SalesOrder so3 = SalesOrder.builder().orderNumber("SO-1003").customer(c3)
                .orderDate(LocalDateTime.now().minusDays(12)).expectedDeliveryDate(LocalDate.now().minusDays(2))
                .status(SalesOrder.OrderStatus.COMPLETED).createdBy("Ayush Patel").build();
        SalesOrderItem so3Item = SalesOrderItem.builder().salesOrder(so3).product(fg1)
                .quantity(BigDecimal.valueOf(3)).unitPrice(BigDecimal.valueOf(45000)).build();
        so3Item.calculateTotal();
        so3.addItem(so3Item);
        so3.recalculateTotals();
        salesOrderRepository.save(so3);

        // 9. Work Orders
        workOrderRepository.save(WorkOrder.builder().workOrderNumber("WO-1001").salesOrder(so1).product(fg1)
                .quantity(BigDecimal.valueOf(5)).startDate(LocalDate.now().minusDays(3)).expectedEndDate(LocalDate.now().plusDays(5))
                .status(WorkOrder.WorkOrderStatus.IN_PROGRESS).assignedTo("Vikram Rao").progressPercentage(BigDecimal.valueOf(60))
                .notes("Main casing assembled, winding and testing in progress").build());

        workOrderRepository.save(WorkOrder.builder().workOrderNumber("WO-1002").salesOrder(so2).product(fg2)
                .quantity(BigDecimal.valueOf(4)).startDate(LocalDate.now()).expectedEndDate(LocalDate.now().plusDays(7))
                .status(WorkOrder.WorkOrderStatus.PLANNED).assignedTo("Vikram Rao").progressPercentage(BigDecimal.ZERO)
                .notes("Scheduled for fabrication in Bay 2").build());

        workOrderRepository.save(WorkOrder.builder().workOrderNumber("WO-1000").salesOrder(so3).product(fg1)
                .quantity(BigDecimal.valueOf(3)).startDate(LocalDate.now().minusDays(10)).expectedEndDate(LocalDate.now().minusDays(3))
                .actualEndDate(LocalDate.now().minusDays(3)).status(WorkOrder.WorkOrderStatus.COMPLETED).assignedTo("Vikram Rao")
                .progressPercentage(BigDecimal.valueOf(100)).notes("Completed QA testing and packaged").build());

        // 10. Purchase Orders
        PurchaseOrder po1 = PurchaseOrder.builder().purchaseOrderNumber("PO-2001").supplier(s2)
                .orderDate(LocalDateTime.now().minusDays(3)).expectedDeliveryDate(LocalDate.now().plusDays(4))
                .status(PurchaseOrder.POStatus.ORDERED).createdBy("Sunita Sharma").approvedBy("System Administrator").build();
        PurchaseOrderItem po1Item = PurchaseOrderItem.builder().purchaseOrder(po1).material(rmBearing)
                .quantity(BigDecimal.valueOf(50)).receivedQuantity(BigDecimal.ZERO).unitPrice(BigDecimal.valueOf(450)).build();
        po1Item.calculateTotal();
        po1.addItem(po1Item);
        po1.recalculateTotal();
        purchaseOrderRepository.save(po1);

        PurchaseOrder po2 = PurchaseOrder.builder().purchaseOrderNumber("PO-2002").supplier(s3)
                .orderDate(LocalDateTime.now().minusDays(1)).expectedDeliveryDate(LocalDate.now().plusDays(6))
                .status(PurchaseOrder.POStatus.SUBMITTED).createdBy("Sunita Sharma").build();
        PurchaseOrderItem po2Item = PurchaseOrderItem.builder().purchaseOrder(po2).material(rmCopper)
                .quantity(BigDecimal.valueOf(20)).receivedQuantity(BigDecimal.ZERO).unitPrice(BigDecimal.valueOf(920)).build();
        po2Item.calculateTotal();
        po2.addItem(po2Item);
        po2.recalculateTotal();
        purchaseOrderRepository.save(po2);

        // 11. Invoices
        Invoice inv1 = Invoice.builder().invoiceNumber("INV-5001").salesOrder(so3).customer(c3)
                .invoiceDate(LocalDate.now().minusDays(2)).dueDate(LocalDate.now().plusDays(28))
                .subtotal(so3.getSubtotal()).tax(so3.getTaxAmount()).totalAmount(so3.getTotalAmount())
                .paidAmount(so3.getTotalAmount()).status(Invoice.InvoiceStatus.PAID).build();
        invoiceRepository.save(inv1);

        Invoice inv2 = Invoice.builder().invoiceNumber("INV-5002").salesOrder(so1).customer(c1)
                .invoiceDate(LocalDate.now()).dueDate(LocalDate.now().plusDays(30))
                .subtotal(so1.getSubtotal()).tax(so1.getTaxAmount()).totalAmount(so1.getTotalAmount())
                .paidAmount(BigDecimal.valueOf(100000)).status(Invoice.InvoiceStatus.PARTIALLY_PAID).build();
        invoiceRepository.save(inv2);

        // 12. Payments
        paymentRepository.save(Payment.builder().paymentReference("PAY-9001").invoice(inv1)
                .paymentDate(LocalDateTime.now().minusDays(1)).amount(inv1.getTotalAmount())
                .paymentMethod(Payment.PaymentMethod.BANK_TRANSFER).transactionReference("NEFT-HDFC-99882233")
                .status(Payment.PaymentStatus.COMPLETED).notes("Full settlement for SO-1003").recordedBy("Rajesh Verma").build());

        paymentRepository.save(Payment.builder().paymentReference("PAY-9002").invoice(inv2)
                .paymentDate(LocalDateTime.now()).amount(BigDecimal.valueOf(100000))
                .paymentMethod(Payment.PaymentMethod.BANK_TRANSFER).transactionReference("RTGS-ICICI-44551122")
                .status(Payment.PaymentStatus.COMPLETED).notes("Advance tranche payment for SO-1001").recordedBy("Rajesh Verma").build());

        // 13. Notifications
        notificationRepository.save(Notification.builder().title("Low Stock Alert: Deep Groove Ball Bearing 6205")
                .message("Material Deep Groove Ball Bearing 6205 is below reorder level (8 remaining, threshold 20).")
                .type(Notification.NotificationType.WARNING).targetRole("PROCUREMENT_OFFICER").isRead(false).build());

        notificationRepository.save(Notification.builder().title("Sales Order Confirmed: SO-1002")
                .message("Sales Order SO-1002 has been confirmed by Ayush Patel.")
                .type(Notification.NotificationType.SUCCESS).targetRole("PRODUCTION_MANAGER").isRead(false).build());

        notificationRepository.save(Notification.builder().title("Work Order In Progress: WO-1001")
                .message("Work Order WO-1001 is 60% complete in Bay 1.")
                .type(Notification.NotificationType.INFO).targetRole("PRODUCTION_MANAGER").isRead(false).build());

        notificationRepository.save(Notification.builder().title("Partial Payment Received: INV-5002")
                .message("Received ₹1,00,000 against Invoice INV-5002 from ABC Manufacturing Pvt Ltd.")
                .type(Notification.NotificationType.SUCCESS).targetRole("FINANCE_OFFICER").isRead(false).build());

        // 14. Audit Logs
        auditLogRepository.save(AuditLog.builder().username("sales@ordercraft.com").action("ORDER_CREATED")
                .entityType("SalesOrder").entityId("SO-1001").newValue("Status: DRAFT, Total: ₹265,500").ipAddress("192.168.1.104").build());

        auditLogRepository.save(AuditLog.builder().username("sales@ordercraft.com").action("ORDER_CONFIRMED")
                .entityType("SalesOrder").entityId("SO-1001").oldValue("DRAFT").newValue("IN_PROGRESS").ipAddress("192.168.1.104").build());

        auditLogRepository.save(AuditLog.builder().username("production@ordercraft.com").action("WORK_ORDER_STARTED")
                .entityType("WorkOrder").entityId("WO-1001").oldValue("PLANNED").newValue("IN_PROGRESS").ipAddress("192.168.1.108").build());

        auditLogRepository.save(AuditLog.builder().username("finance@ordercraft.com").action("PAYMENT_RECORDED")
                .entityType("Payment").entityId("PAY-9002").oldValue("Balance: ₹265,500").newValue("Paid: ₹100,000, Remaining: ₹165,500").ipAddress("192.168.1.112").build());

        log.info("ORDERCRAFT database initialized successfully with realistic enterprise seed data!");
    }

    private void saveInventory(Product p, double qty, double reserved, double reorder, String location) {
        Inventory inv = Inventory.builder()
                .product(p)
                .quantity(BigDecimal.valueOf(qty))
                .reservedQuantity(BigDecimal.valueOf(reserved))
                .reorderLevel(BigDecimal.valueOf(reorder))
                .location(location)
                .build();
        inv.updateStatus();
        inventoryRepository.save(inv);
    }
}
