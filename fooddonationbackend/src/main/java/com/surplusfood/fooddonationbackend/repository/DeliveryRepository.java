package com.surplusfood.fooddonationbackend.repository;

import com.surplusfood.fooddonationbackend.entity.Delivery;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DeliveryRepository
        extends JpaRepository<Delivery, Long> {

    List<Delivery> findByVolunteerId(Long volunteerId);

    List<Delivery> findByRequestId(Long requestId);

    List<Delivery> findByStatus(String status);
}