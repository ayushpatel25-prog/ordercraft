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
public class BomExplosionItemDto {
    private Long materialId;
    private String materialName;
    private String materialSku;
    private BigDecimal unitRequirement;
    private BigDecimal totalRequired;
    private BigDecimal availableStock;
    private BigDecimal shortageQuantity;
    private Boolean isSufficient;
    private String unit;
}
