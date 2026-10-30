package com.ordercraft.dto.finance;

import com.ordercraft.entity.Invoice;
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
public class InvoiceResponse {
    private Long id;
    private String invoiceNumber;
    private Long salesOrderId;
    private String salesOrderNumber;
    private Long customerId;
    private String customerName;
    private String customerEmail;
    private String customerAddress;
    private LocalDate invoiceDate;
    private LocalDate dueDate;
    private BigDecimal subtotal;
    private BigDecimal tax;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private BigDecimal remainingAmount;
    private Invoice.InvoiceStatus status;
    private List<PaymentResponse> payments;
    private LocalDateTime createdAt;
}
