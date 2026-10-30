package com.ordercraft.service;

import com.ordercraft.dto.report.NotificationDto;
import com.ordercraft.entity.Notification;

import java.util.List;

public interface NotificationService {
    void createNotification(String title, String message, Notification.NotificationType type, String targetRole);
    List<NotificationDto> getNotificationsForUser(String role);
    long getUnreadCount(String role);
    void markAsRead(Long id);
    void markAllAsRead(String role);
}
