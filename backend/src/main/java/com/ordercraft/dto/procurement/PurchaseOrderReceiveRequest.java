package com.ordercraft.dto.procurement;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseOrderReceiveRequest {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemReceiveDetail {
        private Long itemId; // purchase_order_item ID
        private BigDecimal receivedQuantity;
    }

    @NotEmpty(message = "Receipt must specify at least one received item")
    private List<ItemReceiveDetail> receivedItems;

    private String notes;
}
