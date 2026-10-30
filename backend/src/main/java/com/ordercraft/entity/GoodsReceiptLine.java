package com.ordercraft.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "goods_receipt_line")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoodsReceiptLine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "grn_id", nullable = false)
    private GoodsReceipt goodsReceipt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "po_line_id", nullable = false)
    private PurchaseOrderItem purchaseOrderItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "qty_received", nullable = false, precision = 19, scale = 4)
    private BigDecimal qtyReceived;

    @Column(name = "qty_accepted", nullable = false, precision = 19, scale = 4)
    private BigDecimal qtyAccepted;

    @Column(name = "qty_rejected", nullable = false, precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal qtyRejected = BigDecimal.ZERO;

    @Column(name = "unit_cost", nullable = false, precision = 19, scale = 4)
    private BigDecimal unitCost;

    @Column(name = "batch_id", length = 50)
    @Builder.Default
    private String batchId = "DEFAULT";
}
