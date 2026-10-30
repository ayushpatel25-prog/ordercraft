package com.ordercraft.repository;

import com.ordercraft.entity.DeliveryNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeliveryNoteRepository extends JpaRepository<DeliveryNote, Long> {
    List<DeliveryNote> findByTenantId(Long tenantId);
    Optional<DeliveryNote> findByTenantIdAndDnNo(Long tenantId, String dnNo);
    Optional<DeliveryNote> findByTenantIdAndPublicId(Long tenantId, String publicId);
    List<DeliveryNote> findByTenantIdAndSalesOrderId(Long tenantId, Long salesOrderId);
}
