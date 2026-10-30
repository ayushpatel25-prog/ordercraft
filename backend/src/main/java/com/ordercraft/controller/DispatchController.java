package com.ordercraft.controller;

import com.ordercraft.entity.DeliveryNote;
import com.ordercraft.multitenancy.TenantContext;
import com.ordercraft.repository.DeliveryNoteRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/dispatch")
@RequiredArgsConstructor
@Tag(name = "M8: Dispatch & Delivery", description = "Delivery Notes, fulfillment tracking, and stock deductions")
public class DispatchController {

    private final DeliveryNoteRepository deliveryNoteRepository;

    @GetMapping("/delivery-notes")
    @PreAuthorize("hasAnyRole('ADMIN', 'TENANT_ADMIN', 'STORE_KEEPER', 'SALES_EXECUTIVE', 'SALES_MANAGER', 'VIEWER')")
    @Operation(summary = "List all delivery notes for active tenant")
    public ResponseEntity<List<DeliveryNote>> listDeliveryNotes() {
        Long tenantId = TenantContext.requireTenantId();
        return ResponseEntity.ok(deliveryNoteRepository.findByTenantId(tenantId));
    }

    @GetMapping("/delivery-notes/order/{orderId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TENANT_ADMIN', 'STORE_KEEPER', 'SALES_EXECUTIVE', 'SALES_MANAGER')")
    @Operation(summary = "List delivery notes for a specific sales order")
    public ResponseEntity<List<DeliveryNote>> listByOrder(@PathVariable Long orderId) {
        Long tenantId = TenantContext.requireTenantId();
        return ResponseEntity.ok(deliveryNoteRepository.findByTenantIdAndSalesOrderId(tenantId, orderId));
    }
}
