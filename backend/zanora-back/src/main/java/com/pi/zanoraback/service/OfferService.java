package com.pi.zanoraback.service;

import com.pi.zanoraback.dto.OfferRequestDTO;
import com.pi.zanoraback.dto.OfferRespondDTO;
import com.pi.zanoraback.dto.OfferResponseDTO;
import com.pi.zanoraback.exception.*;
import com.pi.zanoraback.model.*;
import com.pi.zanoraback.repository.jpa.OfferRepository;
import com.pi.zanoraback.repository.jpa.PropertyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class OfferService {

    private final OfferRepository offerRepository;
    private final PropertyRepository propertyRepository;
    private final UserService userService;

    public OfferResponseDTO createOffer(OfferRequestDTO dto) {
        User buyer = userService.getCurrentlyAuthenticatedUser();

        Property property = propertyRepository.findById(dto.getPropertyId())
                .orElseThrow(() -> new RuntimeException("Property not found with id: " + dto.getPropertyId()));

        // Owner cannot make an offer on their own property
        if (property.getOwner().getId().equals(buyer.getId())) {
            throw new OfferUnauthorizedException("You cannot make an offer on your own property");
        }

        // Property must be available
        if (property.getStatus() != PropertyStatus.AVAILABLE) {
            throw new PropertyNotAvailableException("Property is not available for offers");
        }

        // No duplicate pending offer
        offerRepository.findByPropertyIdAndBuyerIdAndStatus(
                dto.getPropertyId(), buyer.getId(), OfferStatus.PENDING
        ).ifPresent(o -> {
            throw new DuplicateOfferException("You already have a pending offer on this property");
        });

        // Rent dates required when type = RENT
        if (dto.getType() == OfferType.RENT) {
            if (dto.getRentStartDate() == null || dto.getRentEndDate() == null) {
                throw new InvalidOfferException("Rent start and end dates are required for RENT offers");
            }
            if (!dto.getRentEndDate().isAfter(dto.getRentStartDate())) {
                throw new InvalidOfferException("Rent end date must be after start date");
            }
        }

        Offer offer = Offer.builder()
                .property(property)
                .buyer(buyer)
                .type(dto.getType())
                .proposedPrice(dto.getProposedPrice())
                .rentStartDate(dto.getRentStartDate())
                .rentEndDate(dto.getRentEndDate())
                .message(dto.getMessage())
                .status(OfferStatus.PENDING)
                .build();

        return mapToResponseDTO(offerRepository.save(offer));
    }

    public OfferResponseDTO respondToOffer(Long offerId, OfferRespondDTO dto) {
        User owner = userService.getCurrentlyAuthenticatedUser();

        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new OfferNotFoundException("Offer not found with id: " + offerId));

        // Only the property owner can respond
        if (!offer.getProperty().getOwner().getId().equals(owner.getId())) {
            throw new OfferUnauthorizedException("Only the property owner can respond to this offer");
        }

        // Can only respond to pending offers
        if (offer.getStatus() != OfferStatus.PENDING) {
            throw new InvalidOfferException("This offer has already been " + offer.getStatus().name().toLowerCase());
        }

        // Decision must be ACCEPTED or DECLINED
        if (dto.getDecision() == OfferStatus.PENDING) {
            throw new InvalidOfferException("Decision must be ACCEPTED or DECLINED");
        }

        offer.setStatus(dto.getDecision());
        offer.setOwnerNote(dto.getOwnerNote());
        offer.setRespondedAt(LocalDateTime.now());

        // When accepted → update property status and decline all other pending offers
        if (dto.getDecision() == OfferStatus.ACCEPTED) {
            Property property = offer.getProperty();
            property.setStatus(
                    offer.getType() == OfferType.RENT ? PropertyStatus.RENTED : PropertyStatus.PENDING
            );
            propertyRepository.save(property);

            // Auto-decline all other pending offers for this property
            List<Offer> otherPendingOffers = offerRepository
                    .findByPropertyIdAndStatus(property.getId(), OfferStatus.PENDING);

            otherPendingOffers.stream()
                    .filter(o -> !o.getId().equals(offerId))
                    .forEach(o -> {
                        o.setStatus(OfferStatus.DECLINED);
                        o.setOwnerNote("Another offer was accepted for this property");
                        o.setRespondedAt(LocalDateTime.now());
                    });

            offerRepository.saveAll(otherPendingOffers);
        }

        return mapToResponseDTO(offerRepository.save(offer));
    }

    public void cancelOffer(Long offerId) {
        User buyer = userService.getCurrentlyAuthenticatedUser();

        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new OfferNotFoundException("Offer not found with id: " + offerId));

        if (!offer.getBuyer().getId().equals(buyer.getId())) {
            throw new OfferUnauthorizedException("You did not make this offer");
        }

        if (offer.getStatus() != OfferStatus.PENDING) {
            throw new InvalidOfferException("Only pending offers can be cancelled");
        }

        offerRepository.delete(offer);
    }

    @Transactional(readOnly = true)
    public List<OfferResponseDTO> getOffersForProperty(Long propertyId) {
        User owner = userService.getCurrentlyAuthenticatedUser();

        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found with id: " + propertyId));

        if (!property.getOwner().getId().equals(owner.getId())) {
            throw new OfferUnauthorizedException("Only the property owner can view its offers");
        }

        return offerRepository.findByPropertyId(propertyId)
                .stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OfferResponseDTO> getMyOffers() {
        User buyer = userService.getCurrentlyAuthenticatedUser();
        return offerRepository.findByBuyerId(buyer.getId())
                .stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OfferResponseDTO> getIncomingOffers() {
        User owner = userService.getCurrentlyAuthenticatedUser();
        return offerRepository.findByPropertyOwnerId(owner.getId())
                .stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    private OfferResponseDTO mapToResponseDTO(Offer offer) {
        return OfferResponseDTO.builder()
                .id(offer.getId())
                .propertyId(offer.getProperty().getId())
                .propertyTitle(offer.getProperty().getTitle())
                .buyerId(offer.getBuyer().getId())
                .buyerUsername(offer.getBuyer().getUsername())
                .type(offer.getType())
                .proposedPrice(offer.getProposedPrice())
                .rentStartDate(offer.getRentStartDate())
                .rentEndDate(offer.getRentEndDate())
                .status(offer.getStatus())
                .message(offer.getMessage())
                .ownerNote(offer.getOwnerNote())
                .createdAt(offer.getCreatedAt())
                .respondedAt(offer.getRespondedAt())
                .build();
    }
}