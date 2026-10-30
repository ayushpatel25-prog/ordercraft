package com.ordercraft.dto.finance;

import com.ordercraft.entity.Payment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {
    private Long id;
    private String paymentReference;
    private Long invoiceId;
    private String invoiceNumber;
    private LocalDateTime paymentDate;
    private BigDecimal amount;
    private Payment.PaymentMethod paymentMethod;
    private String transactionReference;
    private Payment.PaymentStatus status;
    private String notes;
    private String recordedBy;
    private LocalDateTime createdAt;
}
