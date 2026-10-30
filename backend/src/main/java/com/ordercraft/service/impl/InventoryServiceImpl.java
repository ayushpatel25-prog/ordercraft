package com.ordercraft.service.impl;

import com.ordercraft.dto.inventory.InventoryAdjustmentRequest;
import com.ordercraft.dto.inventory.InventoryResponse;
import com.ordercraft.dto.inventory.InventoryTransactionResponse;
import com.ordercraft.entity.Inventory;
import com.ordercraft.entity.InventoryTransaction;
import com.ordercraft.entity.Notification;
import com.ordercraft.entity.Product;
import com.ordercraft.exception.BusinessException;
import com.ordercraft.exception.ResourceNotFoundException;
import com.ordercraft.repository.InventoryRepository;
import com.ordercraft.repository.InventoryTransactionRepository;
import com.ordercraft.repository.ProductRepository;
import com.ordercraft.service.AuditService;
import com.ordercraft.service.InventoryService;
import com.ordercraft.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventoryServiceImpl implements InventoryService {

    private final InventoryRepository inventoryRepository;
    private final InventoryTransactionRepository transactionRepository;
    private final ProductRepository productRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;

    @Override
    @Transactional(readOnly = true)
    public List<InventoryResponse> getAllInventory() {
        return inventoryRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryResponse> getLowStockItems() {
        return inventoryRepository.findLowStockItems().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public InventoryResponse getInventoryByProductId(Long productId) {
        Inventory inv = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory for product ID: " + productId));
        return toResponse(inv);
    }

    @Override
    @Transactional
    public InventoryResponse adjustStock(InventoryAdjustmentRequest request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", request.getProductId()));

        Inventory inv = inventoryRepository.findByProductId(product.getId())
                .orElseGet(() -> Inventory.builder()
                        .product(product)
                        .quantity(BigDecimal.ZERO)
                        .reservedQuantity(BigDecimal.ZERO)
                        .reorderLevel(BigDecimal.valueOf(10))
                        .location("Warehouse A")
                        .build());

        BigDecimal previousQty = inv.getQuantity();
        BigDecimal newQty = previousQty.add(request.getQuantity());

        if (newQty.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException("Cannot adjust inventory below zero for product: " + product.getName());
        }

        inv.setQuantity(newQty);
        inv.updateStatus();
        Inventory saved = inventoryRepository.save(inv);

        // Record transaction
        String performer = getCurrentUsername();
        InventoryTransaction tx = InventoryTransaction.builder()
                .product(product)
                .transactionType(InventoryTransaction.TransactionType.ADJUSTED)
                .quantity(request.getQuantity())
                .previousQuantity(previousQty)
                .newQuantity(newQty)
                .referenceType(request.getReferenceType() != null ? request.getReferenceType() : "MANUAL")
                .referenceId(request.getReferenceId())
                .notes(request.getNotes() != null ? request.getNotes() : "Stock Manual Adjustment")
                .performedBy(performer)
                .createdAt(LocalDateTime.now())
                .build();
        transactionRepository.save(tx);

        checkLowStockAlert(saved);
        auditService.log("STOCK_ADJUSTED", "Inventory", product.getSku(), "Qty: " + previousQty, "Qty: " + newQty);

        return toResponse(saved);
    }

    @Override
    @Transactional
    public void reserveStock(Long productId, BigDecimal quantity, String refType, String refId) {
        Inventory inv = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory for product ID: " + productId));

        if (inv.getAvailableQuantity().compareTo(quantity) < 0) {
            throw new BusinessException(String.format("Cannot reserve %s units of %s. Only %s available.",
                    quantity, inv.getProduct().getName(), inv.getAvailableQuantity()));
        }

        inv.setReservedQuantity(inv.getReservedQuantity().add(quantity));
        inv.updateStatus();
        inventoryRepository.save(inv);

        recordTx(inv.getProduct(), InventoryTransaction.TransactionType.RESERVED, quantity,
                inv.getQuantity(), inv.getQuantity(), refType, refId, "Reserved for order");
    }

    @Override
    @Transactional
    public void releaseStock(Long productId, BigDecimal quantity, String refType, String refId) {
        Inventory inv = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory for product ID: " + productId));

        BigDecimal newReserved = inv.getReservedQuantity().subtract(quantity);
        inv.setReservedQuantity(newReserved.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : newReserved);
        inv.updateStatus();
        inventoryRepository.save(inv);

        recordTx(inv.getProduct(), InventoryTransaction.TransactionType.RELEASED, quantity,
                inv.getQuantity(), inv.getQuantity(), refType, refId, "Released reservation");
    }

    @Override
    @Transactional
    public void consumeStock(Long productId, BigDecimal quantity, String refType, String refId) {
        Inventory inv = inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory for product ID: " + productId));

        if (inv.getQuantity().compareTo(quantity) < 0) {
            throw new BusinessException(String.format("Cannot consume %s units of %s. Total physical stock is only %s.",
                    quantity, inv.getProduct().getName(), inv.getQuantity()));
        }

        BigDecimal prev = inv.getQuantity();
        BigDecimal newQty = prev.subtract(quantity);
        inv.setQuantity(newQty);

        // Also release reserved quantity if applicable
        if (inv.getReservedQuantity().compareTo(quantity) >= 0) {
            inv.setReservedQuantity(inv.getReservedQuantity().subtract(quantity));
        } else {
            inv.setReservedQuantity(BigDecimal.ZERO);
        }

        inv.updateStatus();
        Inventory saved = inventoryRepository.save(inv);

        recordTx(inv.getProduct(), InventoryTransaction.TransactionType.CONSUMED, quantity,
                prev, newQty, refType, refId, "Consumed in production");

        checkLowStockAlert(saved);
        auditService.log("MATERIAL_CONSUMED", "Inventory", inv.getProduct().getSku(), "Qty: " + prev, "Qty: " + newQty);
    }

    @Override
    @Transactional
    public void receiveStock(Long productId, BigDecimal quantity, String refType, String refId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        Inventory inv = inventoryRepository.findByProductId(productId)
                .orElseGet(() -> Inventory.builder()
                        .product(product)
                        .quantity(BigDecimal.ZERO)
                        .reservedQuantity(BigDecimal.ZERO)
                        .reorderLevel(BigDecimal.valueOf(10))
                        .location("Warehouse A")
                        .build());

        BigDecimal prev = inv.getQuantity();
        BigDecimal newQty = prev.add(quantity);
        inv.setQuantity(newQty);
        inv.updateStatus();
        Inventory saved = inventoryRepository.save(inv);

        recordTx(inv.getProduct(), InventoryTransaction.TransactionType.RECEIVED, quantity,
                prev, newQty, refType, refId, "Received from Purchase Order " + refId);

        auditService.log("MATERIAL_RECEIVED", "Inventory", inv.getProduct().getSku(), "Qty: " + prev, "Qty: " + newQty);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<InventoryTransactionResponse> getTransactions(Pageable pageable) {
        return transactionRepository.findAllByOrderByCreatedAtDesc(pageable).map(this::toTxResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryTransactionResponse> getProductTransactions(Long productId) {
        return transactionRepository.findByProductIdOrderByCreatedAtDesc(productId).stream()
                .map(this::toTxResponse)
                .collect(Collectors.toList());
    }

    private void recordTx(Product p, InventoryTransaction.TransactionType type, BigDecimal qty,
                          BigDecimal prev, BigDecimal next, String refType, String refId, String notes) {
        InventoryTransaction tx = InventoryTransaction.builder()
                .product(p)
                .transactionType(type)
                .quantity(qty)
                .previousQuantity(prev)
                .newQuantity(next)
                .referenceType(refType)
                .referenceId(refId)
                .notes(notes)
                .performedBy(getCurrentUsername())
                .createdAt(LocalDateTime.now())
                .build();
        transactionRepository.save(tx);
    }

    private void checkLowStockAlert(Inventory inv) {
        if (inv.getStatus() == Inventory.StockStatus.LOW_STOCK || inv.getStatus() == Inventory.StockStatus.OUT_OF_STOCK) {
            notificationService.createNotification(
                    "Low Stock Alert: " + inv.getProduct().getName(),
                    String.format("Available stock for '%s' is %s %s (reorder threshold is %s).",
                            inv.getProduct().getName(), inv.getAvailableQuantity(), inv.getProduct().getUnit(), inv.getReorderLevel()),
                    Notification.NotificationType.WARNING,
                    "PROCUREMENT_OFFICER"
            );
        }
    }

    private String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (auth != null && auth.isAuthenticated()) ? auth.getName() : "SYSTEM";
    }

    private InventoryResponse toResponse(Inventory inv) {
        return InventoryResponse.builder()
                .id(inv.getId())
                .productId(inv.getProduct().getId())
                .productName(inv.getProduct().getName())
                .productSku(inv.getProduct().getSku())
                .productCategory(inv.getProduct().getCategory().name())
                .unit(inv.getProduct().getUnit())
                .quantity(inv.getQuantity())
                .reservedQuantity(inv.getReservedQuantity())
                .availableQuantity(inv.getAvailableQuantity())
                .reorderLevel(inv.getReorderLevel())
                .location(inv.getLocation())
                .status(inv.getStatus())
                .lastUpdated(inv.getLastUpdated())
                .build();
    }

    private InventoryTransactionResponse toTxResponse(InventoryTransaction tx) {
        return InventoryTransactionResponse.builder()
                .id(tx.getId())
                .productId(tx.getProduct().getId())
                .productName(tx.getProduct().getName())
                .productSku(tx.getProduct().getSku())
                .transactionType(tx.getTransactionType())
                .quantity(tx.getQuantity())
                .previousQuantity(tx.getPreviousQuantity())
                .newQuantity(tx.getNewQuantity())
                .referenceType(tx.getReferenceType())
                .referenceId(tx.getReferenceId())
                .notes(tx.getNotes())
                .performedBy(tx.getPerformedBy())
                .createdAt(tx.getCreatedAt())
                .build();
    }
}
