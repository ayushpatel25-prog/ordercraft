package com.ordercraft.service;

import com.ordercraft.dto.finance.InvoiceRequest;
import com.ordercraft.dto.finance.InvoiceResponse;
import com.ordercraft.entity.Invoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface InvoiceService {
    Page<InvoiceResponse> getInvoices(String query, Pageable pageable);
    List<InvoiceResponse> getInvoicesByStatus(Invoice.InvoiceStatus status);
    InvoiceResponse getInvoiceById(Long id);
    InvoiceResponse createInvoice(InvoiceRequest request);
    InvoiceResponse issueInvoice(Long id);
    InvoiceResponse cancelInvoice(Long id);
}
