package com.ordercraft.service.impl;

import com.ordercraft.dto.product.ProductRequest;
import com.ordercraft.dto.product.ProductResponse;
import com.ordercraft.entity.Inventory;
import com.ordercraft.entity.Product;
import com.ordercraft.exception.BusinessException;
import com.ordercraft.exception.ResourceNotFoundException;
import com.ordercraft.repository.InventoryRepository;
import com.ordercraft.repository.ProductRepository;
import com.ordercraft.service.AuditService;
import com.ordercraft.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final AuditService auditService;

    @Override
    @Transactional(readOnly = true)
    public Page<ProductResponse> getProducts(String query, Pageable pageable) {
        Page<Product> page = (query != null && !query.trim().isEmpty())
                ? productRepository.searchProducts(query.trim(), pageable)
                : productRepository.findAll(pageable);

        return page.map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> getProductsByCategory(Product.Category category) {
        return productRepository.findByCategory(category).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> getAllActiveProducts() {
        return productRepository.findAll().stream()
                .filter(p -> "ACTIVE".equalsIgnoreCase(p.getStatus()))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        return toResponse(product);
    }

    @Override
    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        if (productRepository.existsBySku(request.getSku().trim())) {
            throw new BusinessException("A product with SKU '" + request.getSku() + "' already exists");
        }

        Product product = Product.builder()
                .name(request.getName().trim())
                .sku(request.getSku().trim().toUpperCase())
                .description(request.getDescription())
                .unitPrice(request.getUnitPrice())
                .unit(request.getUnit() != null ? request.getUnit() : "PCS")
                .category(request.getCategory())
                .status("ACTIVE")
                .build();

        Product saved = productRepository.save(product);

        // Auto-initialize inventory for the product
        Inventory inventory = Inventory.builder()
                .product(saved)
                .quantity(BigDecimal.ZERO)
                .reservedQuantity(BigDecimal.ZERO)
                .reorderLevel(BigDecimal.valueOf(10))
                .location("Warehouse A")
                .status(Inventory.StockStatus.OUT_OF_STOCK)
                .build();
        inventoryRepository.save(inventory);

        auditService.log("PRODUCT_CREATED", "Product", saved.getId().toString(), null, "SKU: " + saved.getSku() + ", Category: " + saved.getCategory());
        return toResponse(saved);
    }

    @Override
    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));

        Optional<Product> existingSku = productRepository.findBySku(request.getSku().trim().toUpperCase());
        if (existingSku.isPresent() && !existingSku.get().getId().equals(id)) {
            throw new BusinessException("SKU '" + request.getSku() + "' is already assigned to another product");
        }

        product.setName(request.getName().trim());
        product.setSku(request.getSku().trim().toUpperCase());
        product.setDescription(request.getDescription());
        product.setUnitPrice(request.getUnitPrice());
        if (request.getUnit() != null) {
            product.setUnit(request.getUnit());
        }
        product.setCategory(request.getCategory());
        if (request.getStatus() != null) {
            product.setStatus(request.getStatus());
        }

        Product saved = productRepository.save(product);
        auditService.log("PRODUCT_UPDATED", "Product", saved.getId().toString(), null, "Updated SKU: " + saved.getSku());
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));

        product.setStatus("INACTIVE");
        productRepository.save(product);
        auditService.log("PRODUCT_DEACTIVATED", "Product", id.toString(), "ACTIVE", "INACTIVE");
    }

    private ProductResponse toResponse(Product p) {
        BigDecimal stock = BigDecimal.ZERO;
        BigDecimal avail = BigDecimal.ZERO;
        Optional<Inventory> inv = inventoryRepository.findByProductId(p.getId());
        if (inv.isPresent()) {
            stock = inv.get().getQuantity();
            avail = inv.get().getAvailableQuantity();
        }

        return ProductResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .sku(p.getSku())
                .description(p.getDescription())
                .unitPrice(p.getUnitPrice())
                .unit(p.getUnit())
                .category(p.getCategory())
                .status(p.getStatus())
                .currentStock(stock)
                .availableStock(avail)
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
