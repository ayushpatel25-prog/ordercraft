package com.ordercraft.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryTransaction {

    public enum TransactionType {
        RECEIVED,
        RESERVED,
        RELEASED,
        CONSUMED,
        ADJUSTED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_type", length = 30, nullable = false)
    private TransactionType transactionType;

    @Column(name = "quantity", precision = 14, scale = 2, nullable = false)
    private BigDecimal quantity;

    @Column(name = "previous_quantity", precision = 14, scale = 2, nullable = false)
    private BigDecimal previousQuantity;

    @Column(name = "new_quantity", precision = 14, scale = 2, nullable = false)
    private BigDecimal newQuantity;

    @Column(name = "reference_type", length = 50)
    private String referenceType; // SALES_ORDER, WORK_ORDER, PURCHASE_ORDER, MANUAL

    @Column(name = "reference_id", length = 100)
    private String referenceId;

    @Column(name = "notes", length = 255)
    private String notes;

    @Column(name = "performed_by", length = 100)
    private String performedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
