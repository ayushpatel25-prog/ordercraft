package com.ordercraft.repository;

import com.ordercraft.entity.GoodsReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GoodsReceiptRepository extends JpaRepository<GoodsReceipt, Long> {
    List<GoodsReceipt> findByTenantId(Long tenantId);
    Optional<GoodsReceipt> findByTenantIdAndGrnNo(Long tenantId, String grnNo);
    Optional<GoodsReceipt> findByTenantIdAndPublicId(Long tenantId, String publicId);
    List<GoodsReceipt> findByTenantIdAndPurchaseOrderId(Long tenantId, Long poId);
}
