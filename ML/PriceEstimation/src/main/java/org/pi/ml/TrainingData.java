package org.pi.ml;

import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrainingData {
    private List<PropertyFeatures> features;
    private List<Double> prices;

    public int size() {
        return features != null ? features.size() : 0;
    }
}
