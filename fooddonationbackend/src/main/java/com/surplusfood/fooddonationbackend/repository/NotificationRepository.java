package com.surplusfood.fooddonationbackend.repository;

import com.surplusfood.fooddonationbackend.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository
        extends JpaRepository<Notification, Long> {

    List<Notification> findByUserIdOrderByIdDesc(Long userId);

    List<Notification> findByUserIdAndReadStatus(
            Long userId,
            boolean readStatus
    );
}