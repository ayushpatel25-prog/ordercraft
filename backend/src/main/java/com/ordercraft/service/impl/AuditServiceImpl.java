package com.ordercraft.service.impl;

import com.ordercraft.dto.report.AuditLogDto;
import com.ordercraft.entity.AuditLog;
import com.ordercraft.repository.AuditLogRepository;
import com.ordercraft.service.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditServiceImpl implements AuditService {

    private final AuditLogRepository auditLogRepository;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String action, String entityType, String entityId, String oldValue, String newValue) {
        String username = "SYSTEM";
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser")) {
            username = auth.getName();
        }

        String ipAddress = "127.0.0.1";
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                ipAddress = request.getRemoteAddr();
            }
        } catch (Exception e) {
            // fallback
        }

        AuditLog logEntry = AuditLog.builder()
                .username(username)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .oldValue(oldValue)
                .newValue(newValue)
                .ipAddress(ipAddress)
                .timestamp(LocalDateTime.now())
                .build();

        auditLogRepository.save(logEntry);
        log.info("AUDIT [{}] {} - Entity: {}:{} by {}", action, entityType, entityId, username);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLogDto> getAuditLogs(String query, Pageable pageable) {
        Page<AuditLog> page = (query != null && !query.trim().isEmpty())
                ? auditLogRepository.searchLogs(query.trim(), pageable)
                : auditLogRepository.findAllByOrderByTimestampDesc(pageable);

        return page.map(l -> AuditLogDto.builder()
                .id(l.getId())
                .username(l.getUsername())
                .action(l.getAction())
                .entityType(l.getEntityType())
                .entityId(l.getEntityId())
                .oldValue(l.getOldValue())
                .newValue(l.getNewValue())
                .ipAddress(l.getIpAddress())
                .timestamp(l.getTimestamp())
                .build());
    }
}
