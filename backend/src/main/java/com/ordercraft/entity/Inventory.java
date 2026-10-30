package com.ordercraft.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Inventory {

    public enum StockStatus {
        IN_STOCK,
        LOW_STOCK,
        OUT_OF_STOCK
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false, unique = true)
    private Product product;

    @Column(name = "quantity", precision = 14, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal quantity = BigDecimal.ZERO;

    @Column(name = "reserved_quantity", precision = 14, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal reservedQuantity = BigDecimal.ZERO;

    @Column(name = "reorder_level", precision = 14, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal reorderLevel = BigDecimal.valueOf(10);

    @Column(name = "location", length = 100, nullable = false)
    @Builder.Default
    private String location = "Warehouse A";

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    @Builder.Default
    private StockStatus status = StockStatus.IN_STOCK;

    @Column(name = "last_updated", nullable = false)
    @Builder.Default
    private LocalDateTime lastUpdated = LocalDateTime.now();

    public BigDecimal getAvailableQuantity() {
        if (quantity == null) return BigDecimal.ZERO;
        BigDecimal reserved = reservedQuantity != null ? reservedQuantity : BigDecimal.ZERO;
        BigDecimal avail = quantity.subtract(reserved);
        return avail.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : avail;
    }

    public void updateStatus() {
        BigDecimal avail = getAvailableQuantity();
        if (avail.compareTo(BigDecimal.ZERO) <= 0) {
            this.status = StockStatus.OUT_OF_STOCK;
        } else if (avail.compareTo(reorderLevel) <= 0) {
            this.status = StockStatus.LOW_STOCK;
        } else {
            this.status = StockStatus.IN_STOCK;
        }
        this.lastUpdated = LocalDateTime.now();
    }
}
