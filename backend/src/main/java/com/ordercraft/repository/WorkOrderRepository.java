package com.ordercraft.repository;

import com.ordercraft.entity.WorkOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkOrderRepository extends JpaRepository<WorkOrder, Long> {
    Optional<WorkOrder> findByWorkOrderNumber(String workOrderNumber);
    List<WorkOrder> findBySalesOrderId(Long salesOrderId);
    List<WorkOrder> findByStatus(WorkOrder.WorkOrderStatus status);

    @Query("SELECT wo FROM WorkOrder wo WHERE " +
           "LOWER(wo.workOrderNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(wo.product.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(wo.assignedTo) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<WorkOrder> searchWorkOrders(@Param("query") String query, Pageable pageable);

    @Query("SELECT COUNT(wo) FROM WorkOrder wo WHERE wo.status = :status")
    long countByStatus(@Param("status") WorkOrder.WorkOrderStatus status);
}
