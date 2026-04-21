package org.pi.ml;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PropertyFeatures {
    private String status;
    private String propertyType;
    private String city;
    private String state;
    private Integer bedrooms;
    private Integer bathrooms;
    private Double sizeM2;

    // Encoded features for ML
    private double[] encodedFeatures;

    public PropertyFeatures(String status, String propertyType, String city, String state,
                            Integer bedrooms, Integer bathrooms, Double sizeM2) {
        this.status = status != null ? status : "À louer";
        this.propertyType = propertyType != null ? propertyType : "Appartements";
        this.city = city != null ? city : "Tunis";
        this.state = state != null ? state : "Tunis";
        this.bedrooms = bedrooms != null ? bedrooms : 2;
        this.bathrooms = bathrooms != null ? bathrooms : 1;
        this.sizeM2 = sizeM2 != null ? sizeM2 : 100.0;
    }
}
