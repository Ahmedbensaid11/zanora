package com.pi.zanoraback.dto;

import com.pi.zanoraback.model.PropertyStatus;
import com.pi.zanoraback.model.PropertyType;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PropertyFilterDTO {

    // Search/autocomplete fields
    private String stateQuery;   // partial text for state search/suggestions
    private String cityQuery;    // partial text for city search/suggestions

    // Exact filters
    private Long stateId;
    private Long cityId;
    private PropertyType type;
    private PropertyStatus status;
    private Double minRating;
    private Double maxRating;
    private Integer bathrooms;
    private Integer bedrooms;

    // Price range (optional)
    private Float minPrice;
    private Float maxPrice;

    // Sorting
    private String sortBy;        // e.g. "pricePerMonth", "createdAt", "bedrooms"
    private String sortDirection; // "asc" or "desc"

    // Pagination
    private int page = 0;
    private int size = 10;
}