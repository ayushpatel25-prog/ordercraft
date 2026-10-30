package com.ordercraft.service;

import com.ordercraft.dto.bom.BomExplosionItemDto;
import com.ordercraft.dto.bom.BomRequest;
import com.ordercraft.dto.bom.BomResponse;

import java.math.BigDecimal;
import java.util.List;

public interface BomService {
    List<BomResponse> getAllBoms();
    BomResponse getBomById(Long id);
    BomResponse getActiveBomForProduct(Long productId);
    BomResponse createBom(BomRequest request);
    BomResponse updateBom(Long id, BomRequest request);
    List<BomExplosionItemDto> calculateRequirements(Long productId, BigDecimal orderQuantity);
}
