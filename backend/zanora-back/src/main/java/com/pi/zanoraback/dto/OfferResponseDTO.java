package com.pi.zanoraback.dto;

import com.pi.zanoraback.model.OfferStatus;
import com.pi.zanoraback.model.OfferType;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OfferResponseDTO {

    private Long id;
    private Long propertyId;
    private String propertyTitle;
    private Long buyerId;
    private String buyerUsername;
    private OfferType type;
    private Float proposedPrice;
    private LocalDateTime rentStartDate;
    private LocalDateTime rentEndDate;
    private OfferStatus status;
    private String message;
    private String ownerNote;
    private LocalDateTime createdAt;
    private LocalDateTime respondedAt;
}