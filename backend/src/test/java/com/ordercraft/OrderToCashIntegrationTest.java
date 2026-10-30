package com.ordercraft;

import com.ordercraft.dto.finance.InvoiceRequest;
import com.ordercraft.dto.finance.InvoiceResponse;
import com.ordercraft.dto.finance.PaymentRequest;
import com.ordercraft.dto.finance.PaymentResponse;
import com.ordercraft.dto.order.SalesOrderItemRequest;
import com.ordercraft.dto.order.SalesOrderRequest;
import com.ordercraft.dto.order.SalesOrderResponse;
import com.ordercraft.dto.workorder.WorkOrderResponse;
import com.ordercraft.entity.Customer;
import com.ordercraft.entity.Invoice;
import com.ordercraft.entity.Payment;
import com.ordercraft.entity.Product;
import com.ordercraft.entity.SalesOrder;
import com.ordercraft.entity.WorkOrder;
import com.ordercraft.repository.*;
import com.ordercraft.service.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
public class OrderToCashIntegrationTest {

    @Autowired
    private SalesOrderService salesOrderService;

    @Autowired
    private WorkOrderService workOrderService;

    @Autowired
    private InvoiceService invoiceService;

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private WorkOrderRepository workOrderRepository;

    @Test
    @DisplayName("End-to-End Order-to-Cash Workflow Verification")
    void testEndToEndOrderToCash() {
        // Step 1: Select Customer & Product
        Customer customer = customerRepository.findAll().get(0);
        Product pumpProduct = productRepository.findBySku("FG-PUMP-500").orElseThrow();

        // Step 2: Create Sales Order
        SalesOrderItemRequest item = SalesOrderItemRequest.builder()
                .productId(pumpProduct.getId())
                .quantity(BigDecimal.valueOf(2))
                .unitPrice(pumpProduct.getUnitPrice())
                .build();

        SalesOrderRequest orderReq = SalesOrderRequest.builder()
                .customerId(customer.getId())
                .expectedDeliveryDate(LocalDate.now().plusDays(10))
                .items(Collections.singletonList(item))
                .build();

        SalesOrderResponse order = salesOrderService.createOrder(orderReq);
        assertEquals(SalesOrder.OrderStatus.DRAFT, order.getStatus());

        // Step 3: Confirm Sales Order (BOM lookup & Work Order generated)
        SalesOrderResponse confirmedOrder = salesOrderService.confirmOrder(order.getId());
        assertEquals(SalesOrder.OrderStatus.IN_PROGRESS, confirmedOrder.getStatus());

        // Step 4: Retrieve auto-generated Work Order
        var workOrders = workOrderRepository.findBySalesOrderId(confirmedOrder.getId());
        assertFalse(workOrders.isEmpty());
        Long woId = workOrders.get(0).getId();

        // Step 5: Start Work Order
        WorkOrderResponse startedWo = workOrderService.startWorkOrder(woId);
        assertEquals(WorkOrder.WorkOrderStatus.IN_PROGRESS, startedWo.getStatus());

        // Step 6: Consume Materials per BOM
        WorkOrderResponse consumedWo = workOrderService.consumeMaterials(woId);
        assertNotNull(consumedWo);

        // Step 7: Complete Production (triggers finished goods stock increase and sets SO status to COMPLETED)
        WorkOrderResponse completedWo = workOrderService.completeWorkOrder(woId);
        assertEquals(WorkOrder.WorkOrderStatus.COMPLETED, completedWo.getStatus());

        SalesOrderResponse completedOrder = salesOrderService.getOrderById(confirmedOrder.getId());
        assertEquals(SalesOrder.OrderStatus.COMPLETED, completedOrder.getStatus());

        // Step 8: Generate Invoice from Completed Sales Order
        InvoiceRequest invoiceReq = InvoiceRequest.builder()
                .salesOrderId(completedOrder.getId())
                .dueDate(LocalDate.now().plusDays(30))
                .build();

        InvoiceResponse invoice = invoiceService.createInvoice(invoiceReq);
        assertEquals(Invoice.InvoiceStatus.ISSUED, invoice.getStatus());
        assertEquals(completedOrder.getTotalAmount(), invoice.getTotalAmount());

        // Step 9: Customer Settles Payment
        PaymentRequest pmtReq = PaymentRequest.builder()
                .invoiceId(invoice.getId())
                .amount(invoice.getTotalAmount())
                .paymentMethod(Payment.PaymentMethod.BANK_TRANSFER)
                .transactionReference("TXN-E2E-TEST-999")
                .notes("Full invoice settlement")
                .build();

        PaymentResponse payment = paymentService.recordPayment(pmtReq);
        assertNotNull(payment);

        InvoiceResponse paidInvoice = invoiceService.getInvoiceById(invoice.getId());
        assertEquals(Invoice.InvoiceStatus.PAID, paidInvoice.getStatus());
        assertEquals(BigDecimal.ZERO.setScale(2), paidInvoice.getRemainingAmount().setScale(2));
    }
}
