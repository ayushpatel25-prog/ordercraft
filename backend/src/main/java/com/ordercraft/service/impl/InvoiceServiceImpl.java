package com.ordercraft.service.impl;

import com.ordercraft.dto.finance.InvoiceRequest;
import com.ordercraft.dto.finance.InvoiceResponse;
import com.ordercraft.dto.finance.PaymentResponse;
import com.ordercraft.entity.Invoice;
import com.ordercraft.entity.Notification;
import com.ordercraft.entity.SalesOrder;
import com.ordercraft.exception.BusinessException;
import com.ordercraft.exception.ResourceNotFoundException;
import com.ordercraft.repository.InvoiceRepository;
import com.ordercraft.repository.SalesOrderRepository;
import com.ordercraft.service.AuditService;
import com.ordercraft.service.InvoiceService;
import com.ordercraft.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InvoiceServiceImpl implements InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;

    @Override
    @Transactional(readOnly = true)
    public Page<InvoiceResponse> getInvoices(String query, Pageable pageable) {
        Page<Invoice> page = (query != null && !query.trim().isEmpty())
                ? invoiceRepository.searchInvoices(query.trim(), pageable)
                : invoiceRepository.findAll(pageable);

        return page.map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InvoiceResponse> getInvoicesByStatus(Invoice.InvoiceStatus status) {
        return invoiceRepository.findByStatus(status).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceById(Long id) {
        Invoice inv = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", id));
        return toResponse(inv);
    }

    @Override
    @Transactional
    public InvoiceResponse createInvoice(InvoiceRequest request) {
        SalesOrder order = salesOrderRepository.findById(request.getSalesOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("SalesOrder", "id", request.getSalesOrderId()));

        if (order.getStatus() == SalesOrder.OrderStatus.CANCELLED || order.getStatus() == SalesOrder.OrderStatus.DRAFT) {
            throw new BusinessException("Cannot generate invoice for order in status: " + order.getStatus());
        }

        Optional<Invoice> existing = invoiceRepository.findBySalesOrderId(order.getId());
        if (existing.isPresent()) {
            throw new BusinessException("An invoice (" + existing.get().getInvoiceNumber() + ") is already generated for Sales Order " + order.getOrderNumber());
        }

        String invNumber = "INV-" + (5000 + new Random().nextInt(4000));
        Invoice invoice = Invoice.builder()
                .invoiceNumber(invNumber)
                .salesOrder(order)
                .customer(order.getCustomer())
                .invoiceDate(LocalDate.now())
                .dueDate(request.getDueDate() != null ? request.getDueDate() : LocalDate.now().plusDays(30))
                .subtotal(order.getSubtotal())
                .tax(order.getTaxAmount())
                .totalAmount(order.getTotalAmount())
                .paidAmount(BigDecimal.ZERO)
                .status(Invoice.InvoiceStatus.ISSUED)
                .build();

        Invoice saved = invoiceRepository.save(invoice);
        auditService.log("INVOICE_GENERATED", "Invoice", saved.getInvoiceNumber(), null,
                "Order: " + order.getOrderNumber() + ", Total: ₹" + saved.getTotalAmount());

        notificationService.createNotification(
                "Invoice Issued: " + saved.getInvoiceNumber(),
                String.format("Invoice generated for %s (Amount: ₹%s, Due: %s)",
                        order.getCustomer().getName(), saved.getTotalAmount(), saved.getDueDate()),
                Notification.NotificationType.INFO,
                "FINANCE_OFFICER"
        );

        return toResponse(saved);
    }

    @Override
    @Transactional
    public InvoiceResponse issueInvoice(Long id) {
        Invoice inv = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", id));

        inv.setStatus(Invoice.InvoiceStatus.ISSUED);
        Invoice saved = invoiceRepository.save(inv);
        auditService.log("INVOICE_ISSUED", "Invoice", saved.getInvoiceNumber(), "DRAFT", "ISSUED");

        return toResponse(saved);
    }

    @Override
    @Transactional
    public InvoiceResponse cancelInvoice(Long id) {
        Invoice inv = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice", "id", id));

        if (inv.getStatus() == Invoice.InvoiceStatus.PAID) {
            throw new BusinessException("Cannot cancel an invoice that has been fully paid");
        }

        inv.setStatus(Invoice.InvoiceStatus.CANCELLED);
        Invoice saved = invoiceRepository.save(inv);
        auditService.log("INVOICE_CANCELLED", "Invoice", saved.getInvoiceNumber(), null, "CANCELLED");

        return toResponse(saved);
    }

    private InvoiceResponse toResponse(Invoice inv) {
        List<PaymentResponse> paymentDtos = (inv.getPayments() != null)
                ? inv.getPayments().stream().map(p -> PaymentResponse.builder()
                        .id(p.getId())
                        .paymentReference(p.getPaymentReference())
                        .invoiceId(inv.getId())
                        .invoiceNumber(inv.getInvoiceNumber())
                        .paymentDate(p.getPaymentDate())
                        .amount(p.getAmount())
                        .paymentMethod(p.getPaymentMethod())
                        .transactionReference(p.getTransactionReference())
                        .status(p.getStatus())
                        .notes(p.getNotes())
                        .recordedBy(p.getRecordedBy())
                        .createdAt(p.getCreatedAt())
                        .build()).collect(Collectors.toList())
                : Collections.emptyList();

        return InvoiceResponse.builder()
                .id(inv.getId())
                .invoiceNumber(inv.getInvoiceNumber())
                .salesOrderId(inv.getSalesOrder().getId())
                .salesOrderNumber(inv.getSalesOrder().getOrderNumber())
                .customerId(inv.getCustomer().getId())
                .customerName(inv.getCustomer().getName())
                .customerEmail(inv.getCustomer().getEmail())
                .customerAddress(inv.getCustomer().getAddress() + ", " + inv.getCustomer().getCity())
                .invoiceDate(inv.getInvoiceDate())
                .dueDate(inv.getDueDate())
                .subtotal(inv.getSubtotal())
                .tax(inv.getTax())
                .totalAmount(inv.getTotalAmount())
                .paidAmount(inv.getPaidAmount())
                .remainingAmount(inv.getRemainingAmount())
                .status(inv.getStatus())
                .payments(paymentDtos)
                .createdAt(inv.getCreatedAt())
                .build();
    }
}
