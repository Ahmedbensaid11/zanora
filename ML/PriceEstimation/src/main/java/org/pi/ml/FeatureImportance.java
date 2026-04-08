package org.pi.ml;

import lombok.Data;

@Data
class FeatureImportance {
    private String featureName;
    private Double importance;
}