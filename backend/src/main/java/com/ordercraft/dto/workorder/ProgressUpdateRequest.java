package com.ordercraft.dto.workorder;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
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
public class ProgressUpdateRequest {

    @NotNull(message = "Progress percentage is required")
    @DecimalMin(value = "0.0", message = "Progress cannot be negative")
    @DecimalMax(value = "100.0", message = "Progress cannot exceed 100%")
    private BigDecimal progressPercentage;

    private String notes;
}
