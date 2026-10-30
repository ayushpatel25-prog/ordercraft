package com.ordercraft.controller;

import com.ordercraft.entity.GoodsReceipt;
import com.ordercraft.multitenancy.TenantContext;
import com.ordercraft.repository.GoodsReceiptRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/goods-receipts")
@RequiredArgsConstructor
@Tag(name = "M6: Procurement & GRN", description = "Goods Receipt Notes and 3-way matching")
public class GoodsReceiptController {

    private final GoodsReceiptRepository goodsReceiptRepository;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TENANT_ADMIN', 'PROCUREMENT_OFFICER', 'STORE_KEEPER', 'FINANCE_USER', 'VIEWER')")
    @Operation(summary = "List all GRNs for the current tenant")
    public ResponseEntity<List<GoodsReceipt>> listGoodsReceipts() {
        Long tenantId = TenantContext.requireTenantId();
        return ResponseEntity.ok(goodsReceiptRepository.findByTenantId(tenantId));
    }

    @GetMapping("/po/{poId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TENANT_ADMIN', 'PROCUREMENT_OFFICER', 'STORE_KEEPER', 'FINANCE_USER')")
    @Operation(summary = "Get GRNs for a purchase order")
    public ResponseEntity<List<GoodsReceipt>> getByPurchaseOrder(@PathVariable Long poId) {
        Long tenantId = TenantContext.requireTenantId();
        return ResponseEntity.ok(goodsReceiptRepository.findByTenantIdAndPurchaseOrderId(tenantId, poId));
    }
}
