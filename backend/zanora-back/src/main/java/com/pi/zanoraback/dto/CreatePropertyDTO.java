package com.pi.zanoraback.dto;


import com.pi.zanoraback.model.PropertyType;
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
    private PropertyType type;

    @NotBlank
    private String address;

    @NotBlank
    private String city;

    @Positive
    private Float area;

    @NotNull @Positive
    private Float pricePerMonth;

    @NotEmpty
    private List<MultipartFile> images;

    @NotNull
    private Integer primaryImageIndex; // index of the primary image in the list
}