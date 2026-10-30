package com.ordercraft.service.impl;

import com.ordercraft.dto.report.NotificationDto;
import com.ordercraft.entity.Notification;
import com.ordercraft.repository.NotificationRepository;
import com.ordercraft.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;

    @Override
    @Transactional
    public void createNotification(String title, String message, Notification.NotificationType type, String targetRole) {
        Notification notification = Notification.builder()
                .title(title)
                .message(message)
                .type(type)
                .targetRole(targetRole)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();
        notificationRepository.save(notification);
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationDto> getNotificationsForUser(String role) {
        return notificationRepository.findForRole(role).stream()
                .map(n -> NotificationDto.builder()
                        .id(n.getId())
                        .title(n.getTitle())
                        .message(n.getMessage())
                        .type(n.getType())
                        .targetRole(n.getTargetRole())
                        .isRead(n.getIsRead())
                        .createdAt(n.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(String role) {
        return notificationRepository.countUnreadForRole(role);
    }

    @Override
    @Transactional
    public void markAsRead(Long id) {
        notificationRepository.findById(id).ifPresent(n -> {
            n.setIsRead(true);
            notificationRepository.save(n);
        });
    }

    @Override
    @Transactional
    public void markAllAsRead(String role) {
        List<Notification> list = notificationRepository.findForRole(role);
        list.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(list);
    }
}
