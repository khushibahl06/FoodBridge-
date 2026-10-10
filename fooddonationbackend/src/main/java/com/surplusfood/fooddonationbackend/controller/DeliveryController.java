
package com.surplusfood.fooddonationbackend.controller;

import com.surplusfood.fooddonationbackend.entity.Delivery;
import com.surplusfood.fooddonationbackend.repository.DeliveryRepository;
import com.surplusfood.fooddonationbackend.repository.DonationRequestRepository;
import com.surplusfood.fooddonationbackend.repository.FoodDonationRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/deliveries")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:5174"
})
public class DeliveryController {

    private final DeliveryRepository deliveryRepository;
    private final FoodDonationRepository donationRepository;
    private final DonationRequestRepository requestRepository;

    public DeliveryController(
            DeliveryRepository deliveryRepository,
            FoodDonationRepository donationRepository,
            DonationRequestRepository requestRepository) {

        this.deliveryRepository = deliveryRepository;
        this.donationRepository = donationRepository;
        this.requestRepository = requestRepository;
    }

    @PostMapping
    public ResponseEntity<Delivery> createDelivery(
            @RequestBody Delivery delivery) {

        delivery.setStatus("ASSIGNED");
        return ResponseEntity.ok(deliveryRepository.save(delivery));
    }

    @GetMapping
    public ResponseEntity<List<Delivery>> getAllDeliveries() {
        return ResponseEntity.ok(deliveryRepository.findAll());
    }

    @GetMapping("/volunteer/{volunteerId}")
    public ResponseEntity<List<Delivery>> getVolunteerDeliveries(
            @PathVariable Long volunteerId) {
        return ResponseEntity.ok(
                deliveryRepository.findByVolunteerId(volunteerId));
    }

    @GetMapping("/request/{requestId}")
    public ResponseEntity<List<Delivery>> getRequestDeliveries(
            @PathVariable Long requestId) {
        return ResponseEntity.ok(
                deliveryRepository.findByRequestId(requestId));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<Delivery>> getDeliveriesByStatus(
            @PathVariable String status) {
        return ResponseEntity.ok(
                deliveryRepository.findByStatus(status.trim().toUpperCase()));
    }

    @PutMapping("/{deliveryId}/status")
    @Transactional
    public ResponseEntity<?> updateDeliveryStatus(
            @PathVariable Long deliveryId,
            @RequestParam String status,
            @RequestParam(required = false) Long volunteerId) {

        Optional<Delivery> optional =
                deliveryRepository.findById(deliveryId);

        if (optional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        String newStatus = status.trim().toUpperCase();

        if (!List.of("ASSIGNED", "ACCEPTED", "PICKED_UP",
                "IN_TRANSIT", "DELIVERED", "CANCELLED")
                .contains(newStatus)) {
            return ResponseEntity.badRequest()
                    .body("Invalid delivery status.");
        }

        Delivery delivery = optional.get();

        if (newStatus.equals("ACCEPTED")) {
            if (volunteerId == null) {
                return ResponseEntity.badRequest()
                        .body("Volunteer ID is required to accept delivery.");
            }
            delivery.setVolunteerId(volunteerId);
        }

        delivery.setStatus(newStatus);
        Delivery updated = deliveryRepository.save(delivery);

        if (newStatus.equals("DELIVERED")) {
            if (delivery.getDonationId() != null) {
                donationRepository.findById(delivery.getDonationId())
                        .ifPresent(donation -> {
                            donation.setStatus("COMPLETED");
                            donationRepository.save(donation);
                        });
            }

            if (delivery.getRequestId() != null) {
                requestRepository.findById(delivery.getRequestId())
                        .ifPresent(request -> {
                            request.setStatus("DELIVERED");
                            requestRepository.save(request);
                        });
            }
        }

        return ResponseEntity.ok(updated);
    }
}
