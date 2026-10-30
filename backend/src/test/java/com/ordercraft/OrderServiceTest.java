package com.ordercraft;

import com.ordercraft.dto.order.SalesOrderItemRequest;
import com.ordercraft.dto.order.SalesOrderRequest;
import com.ordercraft.dto.order.SalesOrderResponse;
import com.ordercraft.entity.Customer;
import com.ordercraft.entity.Product;
import com.ordercraft.entity.SalesOrder;
import com.ordercraft.exception.BusinessException;
import com.ordercraft.repository.*;
import com.ordercraft.service.SalesOrderService;
import org.junit.jupiter.api.BeforeEach;
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
public class OrderServiceTest {

    @Autowired
    private SalesOrderService salesOrderService;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private SalesOrderRepository salesOrderRepository;

    @Autowired
    private WorkOrderRepository workOrderRepository;

    private Customer testCustomer;
    private Product testProduct;

    @BeforeEach
    void setUp() {
        testCustomer = customerRepository.findAll().get(0);
        testProduct = productRepository.findBySku("FG-PUMP-500").orElseThrow();
    }

    @Test
    @DisplayName("Should create draft sales order with calculated taxes and grand total")
    void testCreateOrder() {
        SalesOrderItemRequest itemReq = SalesOrderItemRequest.builder()
                .productId(testProduct.getId())
                .quantity(BigDecimal.valueOf(2))
                .unitPrice(testProduct.getUnitPrice())
                .build();

        SalesOrderRequest req = SalesOrderRequest.builder()
                .customerId(testCustomer.getId())
                .expectedDeliveryDate(LocalDate.now().plusDays(10))
                .items(Collections.singletonList(itemReq))
                .build();

        SalesOrderResponse response = salesOrderService.createOrder(req);

        assertNotNull(response);
        assertNotNull(response.getOrderNumber());
        assertEquals(SalesOrder.OrderStatus.DRAFT, response.getStatus());
        assertEquals(testCustomer.getName(), response.getCustomerName());
        assertEquals(BigDecimal.valueOf(90000).setScale(2), response.getSubtotal());
        // 18% tax on 90,000 is 16,200
        assertEquals(BigDecimal.valueOf(16200).setScale(2), response.getTaxAmount());
        assertEquals(BigDecimal.valueOf(106200).setScale(2), response.getTotalAmount());
    }

    @Test
    @DisplayName("Should confirm order and trigger work order creation for BOM products")
    void testConfirmOrder() {
        SalesOrderItemRequest itemReq = SalesOrderItemRequest.builder()
                .productId(testProduct.getId())
                .quantity(BigDecimal.valueOf(3))
                .unitPrice(testProduct.getUnitPrice())
                .build();

        SalesOrderRequest req = SalesOrderRequest.builder()
                .customerId(testCustomer.getId())
                .items(Collections.singletonList(itemReq))
                .build();

        SalesOrderResponse created = salesOrderService.createOrder(req);
        SalesOrderResponse confirmed = salesOrderService.confirmOrder(created.getId());

        assertEquals(SalesOrder.OrderStatus.IN_PROGRESS, confirmed.getStatus());
        assertNotNull(confirmed.getAssociatedWorkOrderNumber());

        var workOrders = workOrderRepository.findBySalesOrderId(confirmed.getId());
        assertFalse(workOrders.isEmpty());
        assertEquals(BigDecimal.valueOf(3).setScale(2), workOrders.get(0).getQuantity());
    }

    @Test
    @DisplayName("Should prevent confirming an already confirmed or cancelled order")
    void testInvalidOrderStateTransition() {
        SalesOrderItemRequest itemReq = SalesOrderItemRequest.builder()
                .productId(testProduct.getId())
                .quantity(BigDecimal.valueOf(1))
                .unitPrice(testProduct.getUnitPrice())
                .build();

        SalesOrderRequest req = SalesOrderRequest.builder()
                .customerId(testCustomer.getId())
                .items(Collections.singletonList(itemReq))
                .build();

        SalesOrderResponse created = salesOrderService.createOrder(req);
        salesOrderService.confirmOrder(created.getId());

        // Attempting to confirm again must throw BusinessException
        assertThrows(BusinessException.class, () -> salesOrderService.confirmOrder(created.getId()));
    }
}
