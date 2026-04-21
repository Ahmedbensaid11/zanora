package com.pi.zanoraback.repository.jpa;

import com.pi.zanoraback.model.Offer;
import com.pi.zanoraback.model.OfferStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OfferRepository extends JpaRepository<Offer, Long> {

    List<Offer> findByPropertyId(Long propertyId);

    List<Offer> findByBuyerId(Long buyerId);

    List<Offer> findByPropertyIdAndStatus(Long propertyId, OfferStatus status);

    Optional<Offer> findByPropertyIdAndBuyerIdAndStatus(Long propertyId, Long buyerId, OfferStatus status);

    List<Offer> findByPropertyOwnerId(Long ownerId);
}