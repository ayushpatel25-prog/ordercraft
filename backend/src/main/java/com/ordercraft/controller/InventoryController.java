package com.ordercraft.controller;

import com.ordercraft.dto.inventory.InventoryAdjustmentRequest;
import com.ordercraft.dto.inventory.InventoryResponse;
import com.ordercraft.dto.inventory.InventoryTransactionResponse;
import com.ordercraft.service.InventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
@Tag(name = "Inventory", description = "Stock level monitoring, adjustments, and movement history")
public class InventoryController {

    private final InventoryService inventoryService;

    @Operation(summary = "Get all inventory items")
    @GetMapping
    public ResponseEntity<List<InventoryResponse>> getAllInventory() {
        return ResponseEntity.ok(inventoryService.getAllInventory());
    }

    @Operation(summary = "Get low stock items below reorder level")
    @GetMapping("/low-stock")
    public ResponseEntity<List<InventoryResponse>> getLowStockItems() {
        return ResponseEntity.ok(inventoryService.getLowStockItems());
    }

    @Operation(summary = "Get inventory details for a product")
    @GetMapping("/product/{productId}")
    public ResponseEntity<InventoryResponse> getInventoryByProductId(@PathVariable Long productId) {
        return ResponseEntity.ok(inventoryService.getInventoryByProductId(productId));
    }

    @Operation(summary = "Adjust inventory stock level (positive or negative adjustment)")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCTION_MANAGER', 'PROCUREMENT_OFFICER')")
    @PostMapping("/adjust")
    public ResponseEntity<InventoryResponse> adjustStock(@Valid @RequestBody InventoryAdjustmentRequest request) {
        return ResponseEntity.ok(inventoryService.adjustStock(request));
    }

    @Operation(summary = "Get paginated inventory transaction log")
    @GetMapping("/transactions")
    public ResponseEntity<Page<InventoryTransactionResponse>> getTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        return ResponseEntity.ok(inventoryService.getTransactions(PageRequest.of(page, size)));
    }

    @Operation(summary = "Get transaction history for a specific product")
    @GetMapping("/transactions/product/{productId}")
    public ResponseEntity<List<InventoryTransactionResponse>> getProductTransactions(@PathVariable Long productId) {
        return ResponseEntity.ok(inventoryService.getProductTransactions(productId));
    }
}
