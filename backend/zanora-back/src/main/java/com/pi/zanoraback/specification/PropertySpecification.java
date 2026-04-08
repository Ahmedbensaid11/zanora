package com.pi.zanoraback.specification;

import com.pi.zanoraback.dto.PropertyFilterDTO;
import com.pi.zanoraback.model.*;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class PropertySpecification {

    /**
     * Builds a JPA Specification from the given filter DTO.
     * Handles: stateId, cityId, type, status, bathrooms, bedrooms,
     * minPrice/maxPrice, minRating/maxRating.
     *
     * Note: rating filtering is done via a subquery/join if you have a Review
     * entity. Here we assume a "rating" column exists on Property or is handled
     * via a @Formula / view. Adjust the path ("averageRating") to match your schema.
     */
    public static Specification<Property> buildFilter(PropertyFilterDTO filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // --- State filter (via city -> state) ---
            if (filter.getStateId() != null) {
                Join<Property, City> cityJoin = root.join("city", JoinType.LEFT);
                predicates.add(cb.equal(cityJoin.get("state").get("id"), filter.getStateId()));
            }

            // --- City filter ---
            if (filter.getCityId() != null) {
                predicates.add(cb.equal(root.get("city").get("id"), filter.getCityId()));
            }

            // --- Type filter ---
            if (filter.getType() != null) {
                predicates.add(cb.equal(root.get("type"), filter.getType()));
            }

            // --- Status filter ---
            if (filter.getStatus() != null) {
                predicates.add(cb.equal(root.get("status"), filter.getStatus()));
            }

            // --- Bathrooms ---
            if (filter.getBathrooms() != null) {
                predicates.add(cb.equal(root.get("bathrooms"), filter.getBathrooms()));
            }

            // --- Bedrooms ---
            if (filter.getBedrooms() != null) {
                predicates.add(cb.equal(root.get("bedrooms"), filter.getBedrooms()));
            }

            // --- Price range ---
            if (filter.getMinPrice() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("pricePerMonth"), filter.getMinPrice()));
            }
            if (filter.getMaxPrice() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("pricePerMonth"), filter.getMaxPrice()));
            }

            // --- Rating range (assumes Property has an "averageRating" field/formula) ---
            // If you use a separate Review table, replace with a subquery.
            if (filter.getMinRating() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("averageRating"), filter.getMinRating()));
            }
            if (filter.getMaxRating() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("averageRating"), filter.getMaxRating()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}