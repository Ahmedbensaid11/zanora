package com.pi.zanoraback.dto;

import com.pi.zanoraback.model.OfferStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class OfferRespondDTO {

    @NotNull
    private OfferStatus decision; // ACCEPTED or DECLINED only

    private String ownerNote;
}