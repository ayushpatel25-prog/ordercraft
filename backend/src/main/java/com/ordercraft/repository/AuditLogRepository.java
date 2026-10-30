package com.ordercraft.repository;

import com.ordercraft.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    Page<AuditLog> findAllByOrderByTimestampDesc(Pageable pageable);
    List<AuditLog> findByEntityTypeAndEntityIdOrderByTimestampDesc(String entityType, String entityId);

    @Query("SELECT a FROM AuditLog a WHERE " +
           "LOWER(a.username) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(a.action) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(a.entityType) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(a.entityId) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<AuditLog> searchLogs(@Param("query") String query, Pageable pageable);
}
