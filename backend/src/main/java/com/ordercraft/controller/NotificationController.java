package com.ordercraft.controller;

import com.ordercraft.dto.report.NotificationDto;
import com.ordercraft.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "System workflow notifications and alerts")
public class NotificationController {

    private final NotificationService notificationService;

    @Operation(summary = "Get notifications for current user role")
    @GetMapping
    public ResponseEntity<List<NotificationDto>> getNotifications(Authentication authentication) {
        String role = extractRole(authentication);
        return ResponseEntity.ok(notificationService.getNotificationsForUser(role));
    }

    @Operation(summary = "Get unread notifications count")
    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount(Authentication authentication) {
        String role = extractRole(authentication);
        return ResponseEntity.ok(notificationService.getUnreadCount(role));
    }

    @Operation(summary = "Mark single notification as read")
    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Mark all notifications as read")
    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(Authentication authentication) {
        String role = extractRole(authentication);
        notificationService.markAllAsRead(role);
        return ResponseEntity.ok().build();
    }

    private String extractRole(Authentication authentication) {
        if (authentication != null && authentication.getAuthorities() != null && !authentication.getAuthorities().isEmpty()) {
            return authentication.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .findFirst()
                    .orElse("ROLE_ADMIN")
                    .replace("ROLE_", "");
        }
        return "ADMIN";
    }
}
