package com.ordercraft.dto.inventory;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryAdjustmentRequest {

    @NotNull(message = "Product ID is required")
    private Long productId;

    @NotNull(message = "Adjustment quantity is required")
    private BigDecimal quantity; // Positive to add, negative to deduct

    private String transactionType; // ADJUSTED, RECEIVED, CONSUMED, RESERVED, RELEASED
    private String referenceType;
    private String referenceId;
    private String notes;
}
