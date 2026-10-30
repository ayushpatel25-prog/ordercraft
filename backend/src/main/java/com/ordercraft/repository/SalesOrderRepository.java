package com.ordercraft.repository;

import com.ordercraft.entity.SalesOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SalesOrderRepository extends JpaRepository<SalesOrder, Long> {
    Optional<SalesOrder> findByOrderNumber(String orderNumber);
    boolean existsByOrderNumber(String orderNumber);
    List<SalesOrder> findByCustomerId(Long customerId);
    List<SalesOrder> findByStatus(SalesOrder.OrderStatus status);

    @Query("SELECT so FROM SalesOrder so WHERE " +
           "LOWER(so.orderNumber) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(so.customer.name) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<SalesOrder> searchOrders(@Param("query") String query, Pageable pageable);

    @Query("SELECT COUNT(so) FROM SalesOrder so WHERE so.status = :status")
    long countByStatus(@Param("status") SalesOrder.OrderStatus status);

    @Query("SELECT so FROM SalesOrder so WHERE so.orderDate BETWEEN :start AND :end ORDER BY so.orderDate ASC")
    List<SalesOrder> findOrdersBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
