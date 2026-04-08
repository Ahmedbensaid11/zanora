package com.pi.zanoraback.service;

import com.pi.zanoraback.dto.PropertyFilterDTO;
import com.pi.zanoraback.dto.PropertyResponseDTO;
import com.pi.zanoraback.dto.SuggestionDTO;
import com.pi.zanoraback.model.City;
import com.pi.zanoraback.model.Property;
import com.pi.zanoraback.model.State;
import com.pi.zanoraback.repository.jpa.CityRepository;
import com.pi.zanoraback.repository.jpa.PropertyRepository;
import com.pi.zanoraback.repository.jpa.StateRepository;
import com.pi.zanoraback.specification.PropertySpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.Base64;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PropertyFilterService {

    private final PropertyRepository propertyRepository;
    private final StateRepository stateRepository;
    private final CityRepository cityRepository;

    // -----------------------------------------------------------------------
    // Main filter + pagination method
    // -----------------------------------------------------------------------

    /**
     * Returns a paginated, sorted, and filtered page of properties.
     *
     * Supported sortBy values: "pricePerMonth", "createdAt", "bedrooms",
     *   "bathrooms", "area", "averageRating"  (defaults to "createdAt")
     * Supported sortDirection: "asc" | "desc"  (defaults to "desc")
     */
    public Page<PropertyResponseDTO> filterProperties(PropertyFilterDTO filter) {

        // --- Build sort ---
        String sortField = isValidSortField(filter.getSortBy())
                ? filter.getSortBy()
                : "createdAt";

        Sort.Direction direction = "asc".equalsIgnoreCase(filter.getSortDirection())
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        Pageable pageable = PageRequest.of(
                Math.max(filter.getPage(), 0),
                filter.getSize() > 0 ? filter.getSize() : 10,
                Sort.by(direction, sortField)
        );

        // --- Build specification ---
        Specification<Property> spec = PropertySpecification.buildFilter(filter);

        // --- Query ---
        Page<Property> page = propertyRepository.findAll(spec, pageable);

        // --- Map to DTO ---
        return page.map(this::toResponseDTO);
    }

    // -----------------------------------------------------------------------
    // Autocomplete / suggestion endpoints
    // -----------------------------------------------------------------------

    /**
     * Returns up to 10 state suggestions matching the partial query string.
     */
    public List<SuggestionDTO> getStateSuggestions(String query) {
        if (query == null || query.isBlank()) {
            return List.of();
        }
        List<State> states = stateRepository.findSuggestions(query.trim());
        return states.stream()
                .limit(10)
                .map(s -> SuggestionDTO.builder()
                        .id(s.getId())
                        .name(s.getName())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Returns up to 10 city suggestions matching the partial query string.
     * Pass stateId to restrict suggestions to a specific state (optional).
     */
    public List<SuggestionDTO> getCitySuggestions(String query, Long stateId) {
        if (query == null || query.isBlank()) {
            return List.of();
        }
        List<City> cities = cityRepository.findSuggestions(query.trim(), stateId);
        return cities.stream()
                .limit(10)
                .map(c -> SuggestionDTO.builder()
                        .id(c.getId())
                        .name(c.getName())
                        .parentName(c.getState() != null ? c.getState().getName() : null)
                        .build())
                .collect(Collectors.toList());
    }


    private static final List<String> ALLOWED_SORT_FIELDS = List.of(
            "pricePerMonth", "createdAt", "bedrooms", "bathrooms", "area", "averageRating"
    );

    private boolean isValidSortField(String field) {
        return field != null && ALLOWED_SORT_FIELDS.contains(field);
    }

    private PropertyResponseDTO toResponseDTO(Property p) {
        return PropertyResponseDTO.builder()
                .id(p.getId())
                .title(p.getTitle())
                .description(p.getDescription())
                .bedrooms(p.getBedrooms())
                .bathrooms(p.getBathrooms())
                .type(p.getType())
                .address(p.getAddress())
                .cityName(p.getCity() != null ? p.getCity().getName() : null)
                .stateName(p.getCity() != null && p.getCity().getState() != null
                        ? p.getCity().getState().getName() : null)
                .area(p.getArea())
                .pricePerMonth(p.getPricePerMonth())
                .status(p.getStatus())
                .createdAt(p.getCreatedAt())
                .imageUrls(p.getImages() != null
                        ? p.getImages().stream()
                        .filter(img -> img.getData() != null)
                        .map(img -> "data:" + img.getContentType() + ";base64,"
                                + Base64.getEncoder().encodeToString(img.getData()))
                        .collect(Collectors.toList())
                        : List.of())
                .build();
    }
}