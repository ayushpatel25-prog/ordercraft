package com.ordercraft.repository;

import com.ordercraft.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    @Query("SELECT n FROM Notification n WHERE n.targetRole IS NULL OR n.targetRole = :role ORDER BY n.createdAt DESC")
    List<Notification> findForRole(@Param("role") String role);

    @Query("SELECT COUNT(n) FROM Notification n WHERE (n.targetRole IS NULL OR n.targetRole = :role) AND n.isRead = false")
    long countUnreadForRole(@Param("role") String role);

    Page<Notification> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
