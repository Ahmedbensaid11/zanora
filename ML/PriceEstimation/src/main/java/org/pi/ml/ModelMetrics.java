package org.pi.ml;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ModelMetrics {
    private Double meanAbsoluteError;
    private Double rootMeanSquaredError;
    private Double r2Score;
    private Integer trainingSize;
    private Integer testSize;
    private String modelType;
}