package com.ordercraft.dto.order;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalesOrderRequest {

    @NotNull(message = "Customer ID is required")
    private Long customerId;

    private LocalDate expectedDeliveryDate;

    @NotEmpty(message = "Sales order must contain at least one product item")
    private List<SalesOrderItemRequest> items;

    private String notes;
}
