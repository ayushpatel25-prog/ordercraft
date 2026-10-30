package com.ordercraft.service;

import com.ordercraft.dto.finance.PaymentRequest;
import com.ordercraft.dto.finance.PaymentResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface PaymentService {
    Page<PaymentResponse> getPayments(Pageable pageable);
    List<PaymentResponse> getInvoicePayments(Long invoiceId);
    PaymentResponse recordPayment(PaymentRequest request);
}
