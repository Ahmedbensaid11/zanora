package com.pi.zanoraback.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ReviewDTO {

    @NotNull
    private Long propertyId;

    @NotNull
    private Long userId;

    @Min(1) @Max(5)
    private int rating;

    @NotBlank
    @Size(max = 1000)
    private String comment;
}