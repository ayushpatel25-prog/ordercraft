package com.ordercraft.dto.product;

import com.ordercraft.entity.Product;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
    private Long id;
    private String name;
    private String sku;
    private String description;
    private BigDecimal unitPrice;
    private String unit;
    private Product.Category category;
    private String status;
    private BigDecimal currentStock;
    private BigDecimal availableStock;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
