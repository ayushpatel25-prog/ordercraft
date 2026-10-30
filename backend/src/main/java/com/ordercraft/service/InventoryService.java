package com.ordercraft.service;

import com.ordercraft.dto.inventory.InventoryAdjustmentRequest;
import com.ordercraft.dto.inventory.InventoryResponse;
import com.ordercraft.dto.inventory.InventoryTransactionResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;

public interface InventoryService {
    List<InventoryResponse> getAllInventory();
    List<InventoryResponse> getLowStockItems();
    InventoryResponse getInventoryByProductId(Long productId);
    InventoryResponse adjustStock(InventoryAdjustmentRequest request);
    void reserveStock(Long productId, BigDecimal quantity, String refType, String refId);
    void releaseStock(Long productId, BigDecimal quantity, String refType, String refId);
    void consumeStock(Long productId, BigDecimal quantity, String refType, String refId);
    void receiveStock(Long productId, BigDecimal quantity, String refType, String refId);
    Page<InventoryTransactionResponse> getTransactions(Pageable pageable);
    List<InventoryTransactionResponse> getProductTransactions(Long productId);
}
