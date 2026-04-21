package com.pi.zanoraback.dto;

import com.pi.zanoraback.model.PropertyStatus;
import com.pi.zanoraback.model.PropertyType;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PropertyResponseDTO {

    private Long id;
    private String title;
    private String description;
    private Integer bedrooms;
    private Integer bathrooms;
    private PropertyType type;
    private String address;
    private Long cityId;
    private String cityName;
    private String stateName;
    private Double rating;
    private Float area;
    private Float pricePerMonth;
    private PropertyStatus status;
    private LocalDateTime createdAt;
    private List<String> imageUrls;
    private Double averageRating;
}