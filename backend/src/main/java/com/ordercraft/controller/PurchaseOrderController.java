package com.ordercraft.controller;

import com.ordercraft.dto.procurement.PurchaseOrderReceiveRequest;
import com.ordercraft.dto.procurement.PurchaseOrderRequest;
import com.ordercraft.dto.procurement.PurchaseOrderResponse;
import com.ordercraft.entity.PurchaseOrder;
import com.ordercraft.service.PurchaseOrderService;
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
@RequestMapping("/api/purchase-orders")
@RequiredArgsConstructor
@Tag(name = "Purchase Orders", description = "Procure-to-pay workflow and material purchasing")
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;

    @Operation(summary = "Get paginated purchase orders with optional search")
    @GetMapping
    public ResponseEntity<Page<PurchaseOrderResponse>> getPurchaseOrders(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "orderDate") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        return ResponseEntity.ok(purchaseOrderService.getPurchaseOrders(query, PageRequest.of(page, size, sort)));
    }

    @Operation(summary = "Get purchase order by ID")
    @GetMapping("/{id}")
    public ResponseEntity<PurchaseOrderResponse> getPurchaseOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(purchaseOrderService.getPurchaseOrderById(id));
    }

    @Operation(summary = "Get purchase orders by status")
    @GetMapping("/status/{status}")
    public ResponseEntity<List<PurchaseOrderResponse>> getPurchaseOrdersByStatus(@PathVariable PurchaseOrder.POStatus status) {
        return ResponseEntity.ok(purchaseOrderService.getPurchaseOrdersByStatus(status));
    }

    @Operation(summary = "Create a draft purchase order")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROCUREMENT_OFFICER')")
    @PostMapping
    public ResponseEntity<PurchaseOrderResponse> createPurchaseOrder(@Valid @RequestBody PurchaseOrderRequest request) {
        return new ResponseEntity<>(purchaseOrderService.createPurchaseOrder(request), HttpStatus.CREATED);
    }

    @Operation(summary = "Submit purchase order for approval")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROCUREMENT_OFFICER')")
    @PostMapping("/{id}/submit")
    public ResponseEntity<PurchaseOrderResponse> submitPurchaseOrder(@PathVariable Long id) {
        return ResponseEntity.ok(purchaseOrderService.submitPurchaseOrder(id));
    }

    @Operation(summary = "Approve purchase order (Admin/Officer)")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROCUREMENT_OFFICER')")
    @PostMapping("/{id}/approve")
    public ResponseEntity<PurchaseOrderResponse> approvePurchaseOrder(@PathVariable Long id) {
        return ResponseEntity.ok(purchaseOrderService.approvePurchaseOrder(id));
    }

    @Operation(summary = "Receive incoming materials (updates inventory and PO item received quantities)")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROCUREMENT_OFFICER')")
    @PostMapping("/{id}/receive")
    public ResponseEntity<PurchaseOrderResponse> receiveMaterials(
            @PathVariable Long id,
            @Valid @RequestBody PurchaseOrderReceiveRequest request) {
        return ResponseEntity.ok(purchaseOrderService.receiveMaterials(id, request));
    }

    @Operation(summary = "Cancel purchase order")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROCUREMENT_OFFICER')")
    @PostMapping("/{id}/cancel")
    public ResponseEntity<PurchaseOrderResponse> cancelPurchaseOrder(@PathVariable Long id) {
        return ResponseEntity.ok(purchaseOrderService.cancelPurchaseOrder(id));
    }
}
