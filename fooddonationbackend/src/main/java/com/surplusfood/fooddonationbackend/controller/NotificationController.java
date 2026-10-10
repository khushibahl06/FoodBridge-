package com.surplusfood.fooddonationbackend.controller;

import com.surplusfood.fooddonationbackend.entity.Notification;
import com.surplusfood.fooddonationbackend.repository.NotificationRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:5174"
})
public class NotificationController {

    private final NotificationRepository notificationRepository;

    public NotificationController(
            NotificationRepository notificationRepository) {

        this.notificationRepository = notificationRepository;
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Notification>> getUserNotifications(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                notificationRepository
                        .findByUserIdOrderByIdDesc(userId)
        );
    }

    @GetMapping("/user/{userId}/unread")
    public ResponseEntity<List<Notification>> getUnreadNotifications(
            @PathVariable Long userId) {

        return ResponseEntity.ok(
                notificationRepository
                        .findByUserIdAndReadStatus(userId, false)
        );
    }

    @PutMapping("/{notificationId}/read")
    public ResponseEntity<?> markAsRead(
            @PathVariable Long notificationId) {

        Optional<Notification> optionalNotification =
                notificationRepository.findById(notificationId);

        if (optionalNotification.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Notification notification =
                optionalNotification.get();

        notification.setReadStatus(true);

        return ResponseEntity.ok(
                notificationRepository.save(notification)
        );
    }

    @PutMapping("/user/{userId}/read-all")
    public ResponseEntity<?> markAllAsRead(
            @PathVariable Long userId) {

        List<Notification> notifications =
                notificationRepository
                        .findByUserIdAndReadStatus(userId, false);

        for (Notification notification : notifications) {
            notification.setReadStatus(true);
        }

        notificationRepository.saveAll(notifications);

        return ResponseEntity.ok(notifications);
    }
}