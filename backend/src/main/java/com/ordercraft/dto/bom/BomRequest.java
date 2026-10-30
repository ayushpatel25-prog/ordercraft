package com.ordercraft.dto.bom;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BomRequest {

    @NotNull(message = "Product ID is required")
    private Long productId;

    @NotBlank(message = "Version is required")
    private String version;

    private String description;
    private String status;

    @NotEmpty(message = "At least one BOM component item is required")
    private List<BomItemDto> items;
}
