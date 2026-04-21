package org.pi.ml;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PredictionResult {
    private Double predictedPrice;
    private String priceRange;
    private Integer cluster;
    private Double lowerBound;
    private Double upperBound;
    private Integer similarPropertiesCount;
    private Double priceDifferencePercent;
    private String confidence;
    private String note;

    public PredictionResult(Double predictedPrice) {
        this.predictedPrice = predictedPrice;
        this.lowerBound = predictedPrice * 0.8;
        this.upperBound = predictedPrice * 1.2;
        this.priceRange = String.format("%.0f - %.0f DT", lowerBound, upperBound);
        this.cluster = -1;
        this.similarPropertiesCount = 0;
        this.priceDifferencePercent = 0.0;
        this.confidence = "MEDIUM";
    }
}
