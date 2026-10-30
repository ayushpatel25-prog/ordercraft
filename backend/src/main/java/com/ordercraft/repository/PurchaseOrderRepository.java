package com.ordercraft.repository;

import com.ordercraft.entity.PurchaseOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {
    Optional<PurchaseOrder> findByPurchaseOrderNumber(String poNumber);
    List<PurchaseOrder> findBySupplierId(Long supplierId);
    List<PurchaseOrder> findByStatus(PurchaseOrder.POStatus status);

    @Query("SELECT po FROM PurchaseOrder po WHERE " +
           "LOWER(po.purchaseOrderNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(po.supplier.name) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<PurchaseOrder> searchPurchaseOrders(@Param("query") String query, Pageable pageable);

    @Query("SELECT COUNT(po) FROM PurchaseOrder po WHERE po.status IN :statuses")
    long countByStatusIn(@Param("statuses") List<PurchaseOrder.POStatus> statuses);
}
