
package com.surplusfood.fooddonationbackend.repository;

import com.surplusfood.fooddonationbackend.entity.DonationRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DonationRequestRepository
        extends JpaRepository<DonationRequest, Long> {

    List<DonationRequest> findByNgoId(Long ngoId);

    List<DonationRequest> findByDonationId(Long donationId);

    Optional<DonationRequest> findByDonationIdAndNgoId(
            Long donationId,
            Long ngoId
    );
}
