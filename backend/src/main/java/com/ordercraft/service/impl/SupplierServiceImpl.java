package com.ordercraft.service.impl;

import com.ordercraft.dto.procurement.SupplierRequest;
import com.ordercraft.dto.procurement.SupplierResponse;
import com.ordercraft.entity.Supplier;
import com.ordercraft.exception.ResourceNotFoundException;
import com.ordercraft.repository.PurchaseOrderRepository;
import com.ordercraft.repository.SupplierRepository;
import com.ordercraft.service.AuditService;
import com.ordercraft.service.SupplierService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SupplierServiceImpl implements SupplierService {

    private final SupplierRepository supplierRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final AuditService auditService;

    @Override
    @Transactional(readOnly = true)
    public Page<SupplierResponse> getSuppliers(String query, Pageable pageable) {
        Page<Supplier> page = (query != null && !query.trim().isEmpty())
                ? supplierRepository.searchSuppliers(query.trim(), pageable)
                : supplierRepository.findAll(pageable);

        return page.map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SupplierResponse> getAllActiveSuppliers() {
        return supplierRepository.findAll().stream()
                .filter(s -> "ACTIVE".equalsIgnoreCase(s.getStatus()))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public SupplierResponse getSupplierById(Long id) {
        Supplier s = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", id));
        return toResponse(s);
    }

    @Override
    @Transactional
    public SupplierResponse createSupplier(SupplierRequest request) {
        Supplier supplier = Supplier.builder()
                .name(request.getName().trim())
                .contactPerson(request.getContactPerson())
                .email(request.getEmail())
                .phone(request.getPhone())
                .address(request.getAddress())
                .status("ACTIVE")
                .build();

        Supplier saved = supplierRepository.save(supplier);
        auditService.log("SUPPLIER_CREATED", "Supplier", saved.getId().toString(), null, "Created: " + saved.getName());
        return toResponse(saved);
    }

    @Override
    @Transactional
    public SupplierResponse updateSupplier(Long id, SupplierRequest request) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", id));

        supplier.setName(request.getName().trim());
        supplier.setContactPerson(request.getContactPerson());
        supplier.setEmail(request.getEmail());
        supplier.setPhone(request.getPhone());
        supplier.setAddress(request.getAddress());
        if (request.getStatus() != null) {
            supplier.setStatus(request.getStatus());
        }

        Supplier saved = supplierRepository.save(supplier);
        auditService.log("SUPPLIER_UPDATED", "Supplier", saved.getId().toString(), null, "Updated: " + saved.getName());
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteSupplier(Long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", id));

        supplier.setStatus("INACTIVE");
        supplierRepository.save(supplier);
        auditService.log("SUPPLIER_DEACTIVATED", "Supplier", id.toString(), "ACTIVE", "INACTIVE");
    }

    private SupplierResponse toResponse(Supplier s) {
        long poCount = purchaseOrderRepository.findBySupplierId(s.getId()).size();
        return SupplierResponse.builder()
                .id(s.getId())
                .name(s.getName())
                .contactPerson(s.getContactPerson())
                .email(s.getEmail())
                .phone(s.getPhone())
                .address(s.getAddress())
                .status(s.getStatus())
                .totalPurchaseOrders(poCount)
                .createdAt(s.getCreatedAt())
                .updatedAt(s.getUpdatedAt())
                .build();
    }
}
