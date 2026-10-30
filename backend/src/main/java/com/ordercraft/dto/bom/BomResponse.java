package com.ordercraft.dto.bom;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BomResponse {
    private Long id;
    private Long productId;
    private String productName;
    private String productSku;
    private String version;
    private String description;
    private String status;
    private List<BomItemDto> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
