
package com.surplusfood.fooddonationbackend.controller;

import com.surplusfood.fooddonationbackend.entity.FoodDonation;
import com.surplusfood.fooddonationbackend.repository.FoodDonationRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/donations")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:5174"
})
public class FoodDonationController {

    private final FoodDonationRepository donationRepository;

    public FoodDonationController(
            FoodDonationRepository donationRepository) {
        this.donationRepository = donationRepository;
    }

    @PostMapping
    public ResponseEntity<FoodDonation> addDonation(
            @RequestBody FoodDonation donation) {

        donation.setStatus("AVAILABLE");
        donation.setCancellationReason(null);
        donation.setCancelledAt(null);

        FoodDonation savedDonation =
                donationRepository.save(donation);

        return ResponseEntity.ok(savedDonation);
    }

    @GetMapping("/restaurant/{restaurantId}")
    public ResponseEntity<List<FoodDonation>> getRestaurantDonations(
            @PathVariable Long restaurantId) {

        return ResponseEntity.ok(
                donationRepository.findByRestaurantId(restaurantId)
        );
    }

    @GetMapping
    public ResponseEntity<List<FoodDonation>> getAllDonations() {
        return ResponseEntity.ok(donationRepository.findAll());
    }

    @PutMapping("/{donationId}/cancel")
    public ResponseEntity<?> cancelDonation(
            @PathVariable Long donationId,
            @RequestBody Map<String, Object> body) {

        Object restaurantIdValue = body.get("restaurantId");
        Object reasonValue = body.get("reason");

        if (restaurantIdValue == null || reasonValue == null) {
            return ResponseEntity.badRequest().body(
                    Map.of("message",
                            "Restaurant ID and cancellation reason are required.")
            );
        }

        Long restaurantId;
        try {
            restaurantId = Long.valueOf(
                    restaurantIdValue.toString()
            );
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(
                    Map.of("message", "Invalid restaurant ID.")
            );
        }

        String reason = reasonValue.toString().trim();

        if (reason.isEmpty()) {
            return ResponseEntity.badRequest().body(
                    Map.of("message",
                            "Please provide a cancellation reason.")
            );
        }

        if (reason.length() > 500) {
            return ResponseEntity.badRequest().body(
                    Map.of("message",
                            "Cancellation reason cannot exceed 500 characters.")
            );
        }

        FoodDonation donation =
                donationRepository.findById(donationId).orElse(null);

        if (donation == null) {
            return ResponseEntity.notFound().build();
        }

        if (donation.getRestaurantId() == null ||
                !donation.getRestaurantId().equals(restaurantId)) {
            return ResponseEntity.status(403).body(
                    Map.of("message",
                            "You can only cancel your own donations.")
            );
        }

        if (!"AVAILABLE".equalsIgnoreCase(donation.getStatus())) {
            return ResponseEntity.badRequest().body(
                    Map.of("message",
                            "Only available donations can be cancelled.")
            );
        }

        donation.setStatus("CANCELLED");
        donation.setCancellationReason(reason);
        donation.setCancelledAt(LocalDateTime.now());

        FoodDonation savedDonation =
                donationRepository.save(donation);

        return ResponseEntity.ok(savedDonation);
    }
}
