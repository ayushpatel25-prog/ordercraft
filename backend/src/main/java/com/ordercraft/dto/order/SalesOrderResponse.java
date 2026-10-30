package com.ordercraft.dto.order;

import com.ordercraft.entity.SalesOrder;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalesOrderResponse {
    private Long id;
    private String orderNumber;
    private Long customerId;
    private String customerName;
    private String customerEmail;
    private LocalDateTime orderDate;
    private LocalDate expectedDeliveryDate;
    private SalesOrder.OrderStatus status;
    private BigDecimal subtotal;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;
    private String createdBy;
    private List<SalesOrderItemResponse> items;
    private Long associatedWorkOrderId;
    private String associatedWorkOrderNumber;
    private Long associatedInvoiceId;
    private String associatedInvoiceNumber;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
