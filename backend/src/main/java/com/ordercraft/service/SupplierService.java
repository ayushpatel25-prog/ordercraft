package com.ordercraft.service;

import com.ordercraft.dto.procurement.SupplierRequest;
import com.ordercraft.dto.procurement.SupplierResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface SupplierService {
    Page<SupplierResponse> getSuppliers(String query, Pageable pageable);
    List<SupplierResponse> getAllActiveSuppliers();
    SupplierResponse getSupplierById(Long id);
    SupplierResponse createSupplier(SupplierRequest request);
    SupplierResponse updateSupplier(Long id, SupplierRequest request);
    void deleteSupplier(Long id);
}
