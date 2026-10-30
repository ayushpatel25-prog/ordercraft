package com.ordercraft.dto.inventory;

import com.ordercraft.entity.InventoryTransaction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryTransactionResponse {
    private Long id;
    private Long productId;
    private String productName;
    private String productSku;
    private InventoryTransaction.TransactionType transactionType;
    private BigDecimal quantity;
    private BigDecimal previousQuantity;
    private BigDecimal newQuantity;
    private String referenceType;
    private String referenceId;
    private String notes;
    private String performedBy;
    private LocalDateTime createdAt;
}
