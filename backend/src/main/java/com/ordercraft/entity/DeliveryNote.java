package com.ordercraft.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "delivery_note")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeliveryNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "public_id", nullable = false, unique = true, length = 36)
    @Builder.Default
    private String publicId = UUID.randomUUID().toString();

    @Column(name = "dn_no", nullable = false, length = 60)
    private String dnNo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sales_order_id", nullable = false)
    private SalesOrder salesOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "dispatch_date", nullable = false)
    private LocalDate dispatchDate;

    @Column(name = "transporter_name", length = 100)
    private String transporterName;

    @Column(name = "tracking_no", length = 100)
    private String trackingNo;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "DISPATCHED"; // DRAFT, DISPATCHED, DELIVERED, CANCELLED

    @Column(name = "dispatched_by", nullable = false, length = 120)
    private String dispatchedBy;

    @OneToMany(mappedBy = "deliveryNote", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DeliveryNoteLine> lines = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public void addLine(DeliveryNoteLine line) {
        lines.add(line);
        line.setDeliveryNote(this);
    }
}
