package com.ordercraft.dto.report;

import com.ordercraft.entity.Notification;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {
    private Long id;
    private String title;
    private String message;
    private Notification.NotificationType type;
    private String targetRole;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
