package org.pi.entity;

import io.quarkus.hibernate.orm.panache.PanacheEntity;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "listings")
@Data
@EqualsAndHashCode(callSuper = true)
public class Listing extends PanacheEntity {

    @Column(name = "title")
    private String title;

    @Column(name = "url")
    private String url;

    @Column(name = "status")
    private String status;

    @Column(name = "property_type")
    private String propertyType;

    @Column(name = "price")
    private String price;

    @Column(name = "address")
    private String address;

    @Column(name = "city")
    private String city;

    @Column(name = "state")
    private String state;

    @Column(name = "bedrooms")
    private Integer bedrooms;

    @Column(name = "bathrooms")
    private Integer bathrooms;

    @Column(name = "size_m2")
    private String sizeM2;

    @Column(name = "image_url")
    private String imageUrl;

    // Helper method to get numeric size
    public Double getSizeM2Numeric() {
        if (sizeM2 == null || sizeM2.isEmpty()) {
            return 100.0;
        }
        try {
            return Double.parseDouble(sizeM2.replaceAll("[^0-9.]", ""));
        } catch (NumberFormatException e) {
            return 100.0;
        }
    }

    // Helper method to get numeric price
    public Double getPriceNumeric() {
        if (price == null || price.isEmpty()) {
            return null;
        }
        try {
            return Double.parseDouble(price.replaceAll("[^0-9.]", ""));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    // Standardize property type
    public String getStandardizedPropertyType() {
        if (propertyType == null) return "Appartements";

        String normalized = propertyType.trim();
        if (normalized.contains("Villa") || normalized.contains("Maison")) {
            return "Maison Villa";
        } else if (normalized.contains("Bureau")) {
            return "Bureaux";
        } else if (normalized.contains("Commercial")) {
            return "Locaux Commerciaux";
        } else if (normalized.contains("Terrain")) {
            return "Terrain Ferme";
        } else {
            return "Appartements";
        }
    }
}