package com.ordercraft.dto.workorder;

import com.ordercraft.dto.bom.BomExplosionItemDto;
import com.ordercraft.entity.WorkOrder;
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
public class WorkOrderResponse {
    private Long id;
    private String workOrderNumber;
    private Long salesOrderId;
    private String salesOrderNumber;
    private String customerName;
    private Long productId;
    private String productName;
    private String productSku;
    private BigDecimal quantity;
    private LocalDate startDate;
    private LocalDate expectedEndDate;
    private LocalDate actualEndDate;
    private WorkOrder.WorkOrderStatus status;
    private String assignedTo;
    private BigDecimal progressPercentage;
    private String notes;
    private List<BomExplosionItemDto> requiredMaterials;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
