package com.pi.zanoraback.controller;

import com.pi.zanoraback.dto.PropertyFilterDTO;
import com.pi.zanoraback.dto.PropertyResponseDTO;
import com.pi.zanoraback.dto.SuggestionDTO;
import com.pi.zanoraback.model.PropertyStatus;
import com.pi.zanoraback.model.PropertyType;
import com.pi.zanoraback.service.PropertyFilterService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
@CrossOrigin(
        origins = {"http://localhost:5173", "http://localhost:8081"},
        allowCredentials = "true"
)
@RestController
@RequestMapping("/api/properties")
@RequiredArgsConstructor
public class PropertyFilterController {

    private final PropertyFilterService propertyFilterService;

    // -----------------------------------------------------------------------
    // GET /api/properties
    // All query params are optional — omitting them returns all properties.
    //
    // Example:
    // GET /api/properties?stateId=1&cityId=3&type=APARTMENT&status=AVAILABLE
    //      &bathrooms=2&bedrooms=3&minPrice=500&maxPrice=2000
    //      &minRating=3.5&sortBy=pricePerMonth&sortDirection=asc&page=0&size=10
    // -----------------------------------------------------------------------
    @GetMapping
    public ResponseEntity<Page<PropertyResponseDTO>> filterProperties(
            @RequestParam(required = false) Long stateId,
            @RequestParam(required = false) Long cityId,
            @RequestParam(required = false) PropertyType type,
            @RequestParam(required = false) PropertyStatus status,
            @RequestParam(required = false) Integer bathrooms,
            @RequestParam(required = false) Integer bedrooms,
            @RequestParam(required = false) Float minPrice,
            @RequestParam(required = false) Float maxPrice,
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false) Double maxRating,
            @RequestParam(required = false, defaultValue = "createdAt") String sortBy,
            @RequestParam(required = false, defaultValue = "desc") String sortDirection,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        PropertyFilterDTO filter = PropertyFilterDTO.builder()
                .stateId(stateId)
                .cityId(cityId)
                .type(type)
                .status(status)
                .bathrooms(bathrooms)
                .bedrooms(bedrooms)
                .minPrice(minPrice)
                .maxPrice(maxPrice)
                .minRating(minRating)
                .maxRating(maxRating)
                .sortBy(sortBy)
                .sortDirection(sortDirection)
                .page(page)
                .size(size)
                .build();

        return ResponseEntity.ok(propertyFilterService.filterProperties(filter));
    }

    // -----------------------------------------------------------------------
    // GET /api/properties/suggestions/states?query=tun
    // Returns state name suggestions for the search-bar dropdown.
    // -----------------------------------------------------------------------
    @GetMapping("/suggestions/states")
    public ResponseEntity<List<SuggestionDTO>> getStateSuggestions(
            @RequestParam String query
    ) {
        return ResponseEntity.ok(propertyFilterService.getStateSuggestions(query));
    }

    // -----------------------------------------------------------------------
    // GET /api/properties/suggestions/cities?query=sou&stateId=1
    // Returns city name suggestions, optionally scoped to a state.
    // -----------------------------------------------------------------------
    @GetMapping("/suggestions/cities")
    public ResponseEntity<List<SuggestionDTO>> getCitySuggestions(
            @RequestParam String query,
            @RequestParam(required = false) Long stateId
    ) {
        return ResponseEntity.ok(propertyFilterService.getCitySuggestions(query, stateId));
    }
}