package com.ordercraft.service.impl;

import com.ordercraft.dto.bom.BomExplosionItemDto;
import com.ordercraft.dto.bom.BomItemDto;
import com.ordercraft.dto.bom.BomRequest;
import com.ordercraft.dto.bom.BomResponse;
import com.ordercraft.entity.Bom;
import com.ordercraft.entity.BomItem;
import com.ordercraft.entity.Inventory;
import com.ordercraft.entity.Product;
import com.ordercraft.exception.BusinessException;
import com.ordercraft.exception.ResourceNotFoundException;
import com.ordercraft.repository.BomRepository;
import com.ordercraft.repository.InventoryRepository;
import com.ordercraft.repository.ProductRepository;
import com.ordercraft.service.AuditService;
import com.ordercraft.service.BomService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BomServiceImpl implements BomService {

    private final BomRepository bomRepository;
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final AuditService auditService;

    @Override
    @Transactional(readOnly = true)
    public List<BomResponse> getAllBoms() {
        return bomRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public BomResponse getBomById(Long id) {
        Bom bom = bomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BOM", "id", id));
        return toResponse(bom);
    }

    @Override
    @Transactional(readOnly = true)
    public BomResponse getActiveBomForProduct(Long productId) {
        Bom bom = bomRepository.findByProductIdAndStatus(productId, "ACTIVE")
                .orElseThrow(() -> new ResourceNotFoundException("Active BOM not found for Product ID: " + productId));
        return toResponse(bom);
    }

    @Override
    @Transactional
    public BomResponse createBom(BomRequest request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", request.getProductId()));

        Optional<Bom> existingVersion = bomRepository.findByProductIdAndVersion(request.getProductId(), request.getVersion());
        if (existingVersion.isPresent()) {
            throw new BusinessException("BOM Version '" + request.getVersion() + "' already exists for product: " + product.getName());
        }

        Bom bom = Bom.builder()
                .product(product)
                .version(request.getVersion().trim())
                .description(request.getDescription())
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .build();

        for (BomItemDto itemDto : request.getItems()) {
            Product material = productRepository.findById(itemDto.getMaterialId())
                    .orElseThrow(() -> new ResourceNotFoundException("Material", "id", itemDto.getMaterialId()));

            BomItem item = BomItem.builder()
                    .bom(bom)
                    .material(material)
                    .quantityRequired(itemDto.getQuantityRequired())
                    .unit(itemDto.getUnit() != null ? itemDto.getUnit() : material.getUnit())
                    .build();
            bom.addItem(item);
        }

        Bom saved = bomRepository.save(bom);
        auditService.log("BOM_CREATED", "BOM", saved.getId().toString(), null, "Product: " + product.getName() + " v" + saved.getVersion());
        return toResponse(saved);
    }

    @Override
    @Transactional
    public BomResponse updateBom(Long id, BomRequest request) {
        Bom bom = bomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BOM", "id", id));

        bom.setVersion(request.getVersion());
        bom.setDescription(request.getDescription());
        if (request.getStatus() != null) {
            bom.setStatus(request.getStatus());
        }

        bom.getItems().clear();
        for (BomItemDto itemDto : request.getItems()) {
            Product material = productRepository.findById(itemDto.getMaterialId())
                    .orElseThrow(() -> new ResourceNotFoundException("Material", "id", itemDto.getMaterialId()));

            BomItem item = BomItem.builder()
                    .bom(bom)
                    .material(material)
                    .quantityRequired(itemDto.getQuantityRequired())
                    .unit(itemDto.getUnit() != null ? itemDto.getUnit() : material.getUnit())
                    .build();
            bom.addItem(item);
        }

        Bom saved = bomRepository.save(bom);
        auditService.log("BOM_UPDATED", "BOM", saved.getId().toString(), null, "Updated v" + saved.getVersion());
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BomExplosionItemDto> calculateRequirements(Long productId, BigDecimal orderQuantity) {
        Bom bom = bomRepository.findByProductIdAndStatus(productId, "ACTIVE")
                .orElseThrow(() -> new BusinessException("No active BOM configured for product ID: " + productId));

        List<BomExplosionItemDto> result = new ArrayList<>();

        for (BomItem item : bom.getItems()) {
            Product mat = item.getMaterial();
            BigDecimal totalRequired = item.getQuantityRequired().multiply(orderQuantity);

            BigDecimal available = BigDecimal.ZERO;
            Optional<Inventory> inv = inventoryRepository.findByProductId(mat.getId());
            if (inv.isPresent()) {
                available = inv.get().getAvailableQuantity();
            }

            BigDecimal shortage = totalRequired.subtract(available);
            boolean sufficient = shortage.compareTo(BigDecimal.ZERO) <= 0;

            result.add(BomExplosionItemDto.builder()
                    .materialId(mat.getId())
                    .materialName(mat.getName())
                    .materialSku(mat.getSku())
                    .unitRequirement(item.getQuantityRequired())
                    .totalRequired(totalRequired)
                    .availableStock(available)
                    .shortageQuantity(sufficient ? BigDecimal.ZERO : shortage)
                    .isSufficient(sufficient)
                    .unit(item.getUnit())
                    .build());
        }

        return result;
    }

    private BomResponse toResponse(Bom bom) {
        List<BomItemDto> itemDtos = bom.getItems().stream().map(item -> {
            BigDecimal avail = BigDecimal.ZERO;
            Optional<Inventory> inv = inventoryRepository.findByProductId(item.getMaterial().getId());
            if (inv.isPresent()) {
                avail = inv.get().getAvailableQuantity();
            }

            return BomItemDto.builder()
                    .id(item.getId())
                    .materialId(item.getMaterial().getId())
                    .materialName(item.getMaterial().getName())
                    .materialSku(item.getMaterial().getSku())
                    .quantityRequired(item.getQuantityRequired())
                    .unit(item.getUnit())
                    .availableStock(avail)
                    .build();
        }).collect(Collectors.toList());

        return BomResponse.builder()
                .id(bom.getId())
                .productId(bom.getProduct().getId())
                .productName(bom.getProduct().getName())
                .productSku(bom.getProduct().getSku())
                .version(bom.getVersion())
                .description(bom.getDescription())
                .status(bom.getStatus())
                .items(itemDtos)
                .createdAt(bom.getCreatedAt())
                .updatedAt(bom.getUpdatedAt())
                .build();
    }
}
