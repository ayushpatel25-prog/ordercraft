package com.ordercraft.service.impl;

import com.ordercraft.dto.finance.PaymentRequest;
import com.ordercraft.dto.finance.PaymentResponse;
import com.ordercraft.entity.Invoice;
import com.ordercraft.entity.Notification;
import com.ordercraft.entity.Payment;
import com.ordercraft.exception.BusinessException;
import com.ordercraft.exception.ResourceNotFoundException;
import com.ordercraft.repository.InvoiceRepository;
import com.ordercraft.repository.PaymentRepository;
import com.ordercraft.service.AuditService;
import com.ordercraft.service.NotificationService;
import com.ordercraft.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final InvoiceRepository invoiceRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;

    @Override
    @Transactional(readOnly = true)
    public Page<PaymentResponse> getPayments(Pageable pageable) {
        return paymentRepository.findAllByOrderByPaymentDateDesc(pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getInvoicePayments(Long invoiceId) {
        return paymentRepository.findByInvoiceId(invoiceId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PaymentResponse recordPayment(PaymentRequest request) {
        Invoice invoice = invoiceRepository.findById(request.getInvoiceId())
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", request.getInvoiceId()));

        if (invoice.getStatus() == Invoice.InvoiceStatus.CANCELLED) {
            throw new BusinessException("Cannot record payment for a cancelled invoice");
        }

        BigDecimal remaining = invoice.getRemainingAmount();
        if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException("This invoice has already been fully paid");
        }

        if (request.getAmount().compareTo(remaining) > 0) {
            throw new BusinessException(String.format("Payment amount (₹%s) exceeds outstanding invoice balance (₹%s)",
                    request.getAmount(), remaining));
        }

        String paymentRef = "PAY-" + (9000 + new Random().nextInt(1000));
        Payment payment = Payment.builder()
                .paymentReference(paymentRef)
                .invoice(invoice)
                .paymentDate(LocalDateTime.now())
                .amount(request.getAmount())
                .paymentMethod(request.getPaymentMethod())
                .transactionReference(request.getTransactionReference())
                .status(Payment.PaymentStatus.COMPLETED)
                .notes(request.getNotes())
                .recordedBy(getCurrentUsername())
                .build();

        Payment savedPayment = paymentRepository.save(payment);

        // Update invoice paidAmount and status
        invoice.setPaidAmount(invoice.getPaidAmount().add(request.getAmount()));
        invoice.updatePaymentStatus();
        invoiceRepository.save(invoice);

        auditService.log("PAYMENT_RECORDED", "Payment", savedPayment.getPaymentReference(),
                "Invoice: " + invoice.getInvoiceNumber(),
                String.format("Paid: ₹%s, New Balance: ₹%s, Status: %s",
                        request.getAmount(), invoice.getRemainingAmount(), invoice.getStatus()));

        notificationService.createNotification(
                "Payment Received: " + savedPayment.getPaymentReference(),
                String.format("Payment of ₹%s received for invoice %s via %s. Invoice status: %s",
                        request.getAmount(), invoice.getInvoiceNumber(), request.getPaymentMethod(), invoice.getStatus()),
                Notification.NotificationType.SUCCESS,
                "FINANCE_OFFICER"
        );

        return toResponse(savedPayment);
    }

    private PaymentResponse toResponse(Payment p) {
        return PaymentResponse.builder()
                .id(p.getId())
                .paymentReference(p.getPaymentReference())
                .invoiceId(p.getInvoice().getId())
                .invoiceNumber(p.getInvoice().getInvoiceNumber())
                .paymentDate(p.getPaymentDate())
                .amount(p.getAmount())
                .paymentMethod(p.getPaymentMethod())
                .transactionReference(p.getTransactionReference())
                .status(p.getStatus())
                .notes(p.getNotes())
                .recordedBy(p.getRecordedBy())
                .createdAt(p.getCreatedAt())
                .build();
    }

    private String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (auth != null && auth.isAuthenticated()) ? auth.getName() : "Rajesh Verma";
    }
}
