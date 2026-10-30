package com.ordercraft;

import com.ordercraft.dto.finance.PaymentRequest;
import com.ordercraft.dto.finance.PaymentResponse;
import com.ordercraft.entity.Invoice;
import com.ordercraft.entity.Payment;
import com.ordercraft.exception.BusinessException;
import com.ordercraft.repository.InvoiceRepository;
import com.ordercraft.service.PaymentService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
public class PaymentServiceTest {

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Test
    @DisplayName("Should prevent payments exceeding remaining invoice balance")
    void testOverpaymentPrevention() {
        Invoice invoice = invoiceRepository.findByInvoiceNumber("INV-5002").orElseThrow();
        BigDecimal remaining = invoice.getRemainingAmount();

        PaymentRequest req = PaymentRequest.builder()
                .invoiceId(invoice.getId())
                .amount(remaining.add(BigDecimal.valueOf(50000))) // Excess amount
                .paymentMethod(Payment.PaymentMethod.BANK_TRANSFER)
                .notes("Illegal excess payment")
                .build();

        assertThrows(BusinessException.class, () -> paymentService.recordPayment(req));
    }

    @Test
    @DisplayName("Should transition invoice to PAID when exact balance is settled")
    void testFullSettlementMarksPaid() {
        Invoice invoice = invoiceRepository.findByInvoiceNumber("INV-5002").orElseThrow();
        BigDecimal remaining = invoice.getRemainingAmount();

        PaymentRequest req = PaymentRequest.builder()
                .invoiceId(invoice.getId())
                .amount(remaining)
                .paymentMethod(Payment.PaymentMethod.UPI)
                .transactionReference("UPI-TXN-12345")
                .notes("Final settlement")
                .build();

        PaymentResponse response = paymentService.recordPayment(req);

        assertNotNull(response);
        Invoice updatedInvoice = invoiceRepository.findById(invoice.getId()).orElseThrow();
        assertEquals(Invoice.InvoiceStatus.PAID, updatedInvoice.getStatus());
        assertEquals(BigDecimal.ZERO.setScale(2), updatedInvoice.getRemainingAmount().setScale(2));
    }
}
