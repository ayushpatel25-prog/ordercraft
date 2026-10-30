package com.ordercraft.service;

import com.ordercraft.dto.report.AuditLogDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AuditService {
    void log(String action, String entityType, String entityId, String oldValue, String newValue);
    Page<AuditLogDto> getAuditLogs(String query, Pageable pageable);
}
