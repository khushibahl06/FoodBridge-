package com.surplusfood.fooddonationbackend.repository;

import com.surplusfood.fooddonationbackend.entity.FoodDonation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FoodDonationRepository
        extends JpaRepository<FoodDonation, Long> {

    List<FoodDonation> findByRestaurantId(Long restaurantId);
}