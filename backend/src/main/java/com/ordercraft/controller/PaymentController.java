package com.ordercraft.controller;

import com.ordercraft.dto.finance.PaymentRequest;
import com.ordercraft.dto.finance.PaymentResponse;
import com.ordercraft.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Payment collection and accounts settlement")
public class PaymentController {

    private final PaymentService paymentService;

    @Operation(summary = "Get paginated payment transaction history")
    @GetMapping
    public ResponseEntity<Page<PaymentResponse>> getPayments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        return ResponseEntity.ok(paymentService.getPayments(PageRequest.of(page, size)));
    }

    @Operation(summary = "Get payment history for an invoice")
    @GetMapping("/invoice/{invoiceId}")
    public ResponseEntity<List<PaymentResponse>> getInvoicePayments(@PathVariable Long invoiceId) {
        return ResponseEntity.ok(paymentService.getInvoicePayments(invoiceId));
    }

    @Operation(summary = "Record payment against an invoice (supports partial and full settlement)")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_OFFICER')")
    @PostMapping
    public ResponseEntity<PaymentResponse> recordPayment(@Valid @RequestBody PaymentRequest request) {
        return new ResponseEntity<>(paymentService.recordPayment(request), HttpStatus.CREATED);
    }
}
