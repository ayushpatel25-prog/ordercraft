package com.ordercraft.controller;

import com.ordercraft.entity.Tenant;
import com.ordercraft.multitenancy.TenantContext;
import com.ordercraft.repository.TenantRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tenants")
@RequiredArgsConstructor
@Tag(name = "M1: IAM & Tenants", description = "Multi-Tenant Management and Settings APIs")
public class TenantController {

    private final TenantRepository tenantRepository;

    @GetMapping
    @Operation(summary = "List all active tenants (SaaS Catalog)")
    public ResponseEntity<List<Tenant>> listTenants() {
        return ResponseEntity.ok(tenantRepository.findAll());
    }

    @GetMapping("/current")
    @Operation(summary = "Get current authenticated tenant details and settings")
    public ResponseEntity<Tenant> getCurrentTenant() {
        Long tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            tenantId = 1L; // Fallback to primary tenant for demo
        }
        return tenantRepository.findById(tenantId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/current/settings")
    @PreAuthorize("hasRole('ADMIN') or hasRole('TENANT_ADMIN')")
    @Operation(summary = "Update current tenant settings JSON (approval thresholds, tax regime, etc.)")
    public ResponseEntity<Tenant> updateTenantSettings(@RequestBody String settingsJson) {
        Long tenantId = TenantContext.requireTenantId();
        return tenantRepository.findById(tenantId)
                .map(tenant -> {
                    tenant.setSettingsJson(settingsJson);
                    return ResponseEntity.ok(tenantRepository.save(tenant));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
