package com.pi.zanoraback.dto;


import com.pi.zanoraback.model.PropertyType;
import jakarta.persistence.Column;
import jakarta.validation.constraints.*;
import lombok.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CreatePropertyDTO {

    @NotBlank
    private String title;

    private String description;
    @NotNull
    private Integer bedrooms;
    @NotNull
    private Integer bathrooms;

    @NotNull
    private PropertyType type;

    @NotBlank
    private String address;

    @NotNull
    private Long cityId;
    private Double rating;

    @Positive
    private Float area;

    @NotNull @Positive
    private Float pricePerMonth;

    private List<MultipartFile> images;

    @NotNull
    private Integer primaryImageIndex; // index of the primary image in the list
}