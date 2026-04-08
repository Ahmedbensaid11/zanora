package com.pi.zanoraback.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.pi.zanoraback.model.OfferType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class OfferRequestDTO {

    @NotNull
    private Long propertyId;

    @NotNull
    private OfferType type;

    @NotNull
    @Positive
    private Float proposedPrice;

    @JsonFormat(pattern = "yyyy-M-d'T'HH:mm:ss")
    private LocalDateTime rentStartDate;

    @JsonFormat(pattern = "yyyy-M-d'T'HH:mm:ss")
    private LocalDateTime rentEndDate;

    private String message;
}