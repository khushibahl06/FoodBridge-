
package com.surplusfood.fooddonationbackend.controller;

import com.surplusfood.fooddonationbackend.entity.DonationRequest;
import com.surplusfood.fooddonationbackend.entity.Delivery;
import com.surplusfood.fooddonationbackend.entity.FoodDonation;
import com.surplusfood.fooddonationbackend.entity.Notification;
import com.surplusfood.fooddonationbackend.entity.User;

import com.surplusfood.fooddonationbackend.repository.DonationRequestRepository;
import com.surplusfood.fooddonationbackend.repository.DeliveryRepository;
import com.surplusfood.fooddonationbackend.repository.FoodDonationRepository;
import com.surplusfood.fooddonationbackend.repository.NotificationRepository;
import com.surplusfood.fooddonationbackend.repository.UserRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/requests")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://localhost:5174"
})
public class DonationRequestController {

    private final DonationRequestRepository requestRepository;
    private final DeliveryRepository deliveryRepository;
    private final FoodDonationRepository donationRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    public DonationRequestController(
            DonationRequestRepository requestRepository,
            DeliveryRepository deliveryRepository,
            FoodDonationRepository donationRepository,
            UserRepository userRepository,
            NotificationRepository notificationRepository) {

        this.requestRepository = requestRepository;
        this.deliveryRepository = deliveryRepository;
        this.donationRepository = donationRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
    }

    @PostMapping
    public ResponseEntity<?> createRequest(
            @RequestBody DonationRequest request) {

        if (request.getDonationId() == null
                || request.getNgoId() == null) {
            return ResponseEntity.badRequest()
                    .body("Donation ID and NGO ID are required.");
        }

        Optional<FoodDonation> donation =
                donationRepository.findById(request.getDonationId());

        if (donation.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body("Donation not found.");
        }

        Optional<User> ngo =
                userRepository.findById(request.getNgoId());

        if (ngo.isEmpty()
                || !"NGO".equalsIgnoreCase(ngo.get().getRole())) {
            return ResponseEntity.badRequest()
                    .body("Valid NGO not found.");
        }

        Optional<DonationRequest> existing =
                requestRepository.findByDonationIdAndNgoId(
                        request.getDonationId(),
                        request.getNgoId());

        if (existing.isPresent()) {
            return ResponseEntity.status(409)
                    .body("You have already requested this donation.");
        }

        request.setId(null);
        request.setStatus("PENDING");
        request.setCreatedAt(null);

        DonationRequest saved =
                requestRepository.save(request);

        Notification notification = new Notification();
        notification.setUserId(donation.get().getRestaurantId());
        notification.setMessage(
                "A new NGO request has been received for donation: "
                        + donation.get().getFoodName());
        notification.setType("REQUEST");
        notification.setReadStatus(false);
        notificationRepository.save(notification);

        return ResponseEntity.ok(saved);
    }

    @GetMapping
    public ResponseEntity<List<DonationRequest>> getAllRequests() {
        return ResponseEntity.ok(requestRepository.findAll());
    }

    @GetMapping("/ngo/{ngoId}")
    public ResponseEntity<List<DonationRequest>> getNgoRequests(
            @PathVariable Long ngoId) {
        return ResponseEntity.ok(requestRepository.findByNgoId(ngoId));
    }

    @GetMapping("/donation/{donationId}")
    public ResponseEntity<List<DonationRequest>> getDonationRequests(
            @PathVariable Long donationId) {
        return ResponseEntity.ok(
                requestRepository.findByDonationId(donationId));
    }

    @PutMapping("/{requestId}/status")
    public ResponseEntity<?> updateRequestStatus(
            @PathVariable Long requestId,
            @RequestParam String status) {

        Optional<DonationRequest> optionalRequest =
                requestRepository.findById(requestId);

        if (optionalRequest.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        String newStatus = status.trim().toUpperCase();

        if (!List.of("PENDING", "APPROVED", "REJECTED",
                "DELIVERED").contains(newStatus)) {
            return ResponseEntity.badRequest()
                    .body("Invalid request status.");
        }

        DonationRequest request = optionalRequest.get();
        request.setStatus(newStatus);

        Optional<FoodDonation> optionalDonation =
                donationRepository.findById(request.getDonationId());

        if (newStatus.equals("APPROVED")) {
            if (optionalDonation.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body("Donation not found.");
            }

            List<Delivery> existing =
                    deliveryRepository.findByRequestId(request.getId());

            if (existing.isEmpty()) {
                Optional<User> optionalNgo =
                        userRepository.findById(request.getNgoId());

                if (optionalNgo.isEmpty()) {
                    return ResponseEntity.badRequest()
                            .body("NGO not found.");
                }

                FoodDonation donation = optionalDonation.get();
                User ngo = optionalNgo.get();

                Delivery delivery = new Delivery();
                delivery.setRequestId(request.getId());
                delivery.setDonationId(request.getDonationId());
                delivery.setVolunteerId(null);
                delivery.setStatus("ASSIGNED");
                delivery.setPickupAddress(donation.getPickupAddress());
                delivery.setDeliveryAddress(ngo.getAddress());

                deliveryRepository.save(delivery);

                notifyVolunteers();
            }
        }

        DonationRequest updated = requestRepository.save(request);

        if (newStatus.equals("APPROVED")
                || newStatus.equals("REJECTED")) {
            Notification notification = new Notification();
            notification.setUserId(request.getNgoId());
            notification.setType(newStatus);
            notification.setReadStatus(false);
            notification.setMessage(
                    newStatus.equals("APPROVED")
                            ? "Your food donation request has been approved."
                            : "Your food donation request has been rejected.");
            notificationRepository.save(notification);
        }

        return ResponseEntity.ok(updated);
    }

    private void notifyVolunteers() {
        List<User> volunteers = userRepository.findAll()
                .stream()
                .filter(user ->
                        "VOLUNTEER".equalsIgnoreCase(user.getRole()))
                .toList();

        for (User volunteer : volunteers) {
            Notification notification = new Notification();
            notification.setUserId(volunteer.getId());
            notification.setMessage(
                    "A new food delivery is available for pickup.");
            notification.setType("DELIVERY");
            notification.setReadStatus(false);
            notificationRepository.save(notification);
        }
    }
}
