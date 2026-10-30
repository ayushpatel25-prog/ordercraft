package com.ordercraft.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "username", length = 100, nullable = false)
    private String username;

    @Column(name = "action", length = 100, nullable = false)
    private String action; // ORDER_CREATED, ORDER_CONFIRMED, BOM_CREATED, WORK_ORDER_STARTED, MATERIAL_CONSUMED, etc.

    @Column(name = "entity_type", length = 50, nullable = false)
    private String entityType; // SalesOrder, WorkOrder, Inventory, Invoice, Payment, etc.

    @Column(name = "entity_id", length = 100, nullable = false)
    private String entityId;

    @Lob
    @Column(name = "old_value")
    private String oldValue;

    @Lob
    @Column(name = "new_value")
    private String newValue;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "timestamp", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}
