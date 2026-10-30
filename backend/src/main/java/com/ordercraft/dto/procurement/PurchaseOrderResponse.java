package com.ordercraft.dto.procurement;

import com.ordercraft.entity.PurchaseOrder;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseOrderResponse {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class POItemResponse {
        private Long id;
        private Long materialId;
        private String materialName;
        private String materialSku;
        private String unit;
        private BigDecimal quantity;
        private BigDecimal receivedQuantity;
        private BigDecimal unitPrice;
        private BigDecimal totalPrice;
    }

    private Long id;
    private String purchaseOrderNumber;
    private Long supplierId;
    private String supplierName;
    private LocalDateTime orderDate;
    private LocalDate expectedDeliveryDate;
    private PurchaseOrder.POStatus status;
    private BigDecimal totalAmount;
    private String createdBy;
    private String approvedBy;
    private List<POItemResponse> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
