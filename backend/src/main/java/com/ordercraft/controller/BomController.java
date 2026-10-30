package com.ordercraft.controller;

import com.ordercraft.dto.bom.BomExplosionItemDto;
import com.ordercraft.dto.bom.BomRequest;
import com.ordercraft.dto.bom.BomResponse;
import com.ordercraft.service.BomService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/boms")
@RequiredArgsConstructor
@Tag(name = "Bills of Materials (BOM)", description = "BOM definition, component lists, and material requirement calculation")
public class BomController {

    private final BomService bomService;

    @Operation(summary = "Get all Bills of Materials")
    @GetMapping
    public ResponseEntity<List<BomResponse>> getAllBoms() {
        return ResponseEntity.ok(bomService.getAllBoms());
    }

    @Operation(summary = "Get BOM by ID")
    @GetMapping("/{id}")
    public ResponseEntity<BomResponse> getBomById(@PathVariable Long id) {
        return ResponseEntity.ok(bomService.getBomById(id));
    }

    @Operation(summary = "Get active BOM for a finished product")
    @GetMapping("/product/{productId}")
    public ResponseEntity<BomResponse> getActiveBomForProduct(@PathVariable Long productId) {
        return ResponseEntity.ok(bomService.getActiveBomForProduct(productId));
    }

    @Operation(summary = "Calculate required component materials for given order quantity")
    @GetMapping("/product/{productId}/requirements")
    public ResponseEntity<List<BomExplosionItemDto>> calculateRequirements(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "1.0") BigDecimal quantity) {
        return ResponseEntity.ok(bomService.calculateRequirements(productId, quantity));
    }

    @Operation(summary = "Create Bill of Materials")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCTION_MANAGER')")
    @PostMapping
    public ResponseEntity<BomResponse> createBom(@Valid @RequestBody BomRequest request) {
        return new ResponseEntity<>(bomService.createBom(request), HttpStatus.CREATED);
    }

    @Operation(summary = "Update Bill of Materials")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCTION_MANAGER')")
    @PutMapping("/{id}")
    public ResponseEntity<BomResponse> updateBom(@PathVariable Long id, @Valid @RequestBody BomRequest request) {
        return ResponseEntity.ok(bomService.updateBom(id, request));
    }
}
