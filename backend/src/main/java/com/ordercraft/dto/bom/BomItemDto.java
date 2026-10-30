package com.ordercraft.dto.bom;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BomItemDto {
    private Long id;
    private Long materialId;
    private String materialName;
    private String materialSku;
    private BigDecimal quantityRequired;
    private String unit;
    private BigDecimal availableStock;
}
