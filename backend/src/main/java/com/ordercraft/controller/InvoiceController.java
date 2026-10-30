package com.ordercraft.controller;

import com.ordercraft.dto.finance.InvoiceRequest;
import com.ordercraft.dto.finance.InvoiceResponse;
import com.ordercraft.entity.Invoice;
import com.ordercraft.service.InvoiceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
@Tag(name = "Invoices", description = "Invoicing, billing, and accounts receivable")
public class InvoiceController {

    private final InvoiceService invoiceService;

    @Operation(summary = "Get paginated invoices with optional search")
    @GetMapping
    public ResponseEntity<Page<InvoiceResponse>> getInvoices(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "invoiceDate") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        return ResponseEntity.ok(invoiceService.getInvoices(query, PageRequest.of(page, size, sort)));
    }

    @Operation(summary = "Get invoice by ID")
    @GetMapping("/{id}")
    public ResponseEntity<InvoiceResponse> getInvoiceById(@PathVariable Long id) {
        return ResponseEntity.ok(invoiceService.getInvoiceById(id));
    }

    @Operation(summary = "Get invoices by status")
    @GetMapping("/status/{status}")
    public ResponseEntity<List<InvoiceResponse>> getInvoicesByStatus(@PathVariable Invoice.InvoiceStatus status) {
        return ResponseEntity.ok(invoiceService.getInvoicesByStatus(status));
    }

    @Operation(summary = "Generate invoice from eligible Sales Order")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_OFFICER')")
    @PostMapping
    public ResponseEntity<InvoiceResponse> createInvoice(@Valid @RequestBody InvoiceRequest request) {
        return new ResponseEntity<>(invoiceService.createInvoice(request), HttpStatus.CREATED);
    }

    @Operation(summary = "Issue invoice")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_OFFICER')")
    @PostMapping("/{id}/issue")
    public ResponseEntity<InvoiceResponse> issueInvoice(@PathVariable Long id) {
        return ResponseEntity.ok(invoiceService.issueInvoice(id));
    }

    @Operation(summary = "Cancel invoice")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_OFFICER')")
    @PostMapping("/{id}/cancel")
    public ResponseEntity<InvoiceResponse> cancelInvoice(@PathVariable Long id) {
        return ResponseEntity.ok(invoiceService.cancelInvoice(id));
    }
}
