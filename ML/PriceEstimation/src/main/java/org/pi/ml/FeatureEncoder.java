package org.pi.ml;

import jakarta.enterprise.context.ApplicationScoped;
import lombok.Getter;
import org.jboss.logging.Logger;

import java.util.*;
import java.util.stream.Collectors;

@ApplicationScoped
public class FeatureEncoder {

    private static final Logger LOG = Logger.getLogger(FeatureEncoder.class);

    @Getter
    private Map<String, List<String>> categoryMappings = new HashMap<>();

    private Map<String, Double> featureMeans = new HashMap<>();
    private Map<String, Double> featureStdDevs = new HashMap<>();

    private boolean isFitted = false;


    public void fit(List<PropertyFeatures> features) {
        LOG.info("Fitting feature encoder on " + features.size() + " samples");

        Set<String> statuses = new HashSet<>();
        Set<String> propertyTypes = new HashSet<>();
        Set<String> cities = new HashSet<>();
        Set<String> states = new HashSet<>();

        List<Double> allBedrooms = new ArrayList<>();
        List<Double> allBathrooms = new ArrayList<>();
        List<Double> allSizes = new ArrayList<>();

        for (PropertyFeatures feature : features) {
            statuses.add(feature.getStatus());
            propertyTypes.add(feature.getPropertyType());
            cities.add(feature.getCity());
            states.add(feature.getState());

            allBedrooms.add(feature.getBedrooms().doubleValue());
            allBathrooms.add(feature.getBathrooms().doubleValue());
            allSizes.add(feature.getSizeM2());
        }

        categoryMappings.put("status", new ArrayList<>(statuses).stream().sorted().collect(Collectors.toList()));
        categoryMappings.put("property_type", new ArrayList<>(propertyTypes).stream().sorted().collect(Collectors.toList()));
        categoryMappings.put("city", new ArrayList<>(cities).stream().sorted().collect(Collectors.toList()));
        categoryMappings.put("state", new ArrayList<>(states).stream().sorted().collect(Collectors.toList()));

        featureMeans.put("bedrooms", calculateMean(allBedrooms));
        featureMeans.put("bathrooms", calculateMean(allBathrooms));
        featureMeans.put("size_m2", calculateMean(allSizes));

        featureStdDevs.put("bedrooms", calculateStdDev(allBedrooms, featureMeans.get("bedrooms")));
        featureStdDevs.put("bathrooms", calculateStdDev(allBathrooms, featureMeans.get("bathrooms")));
        featureStdDevs.put("size_m2", calculateStdDev(allSizes, featureMeans.get("size_m2")));

        isFitted = true;

        LOG.infof("Encoder fitted with %d unique statuses, %d property types, %d cities",
                statuses.size(), propertyTypes.size(), cities.size());
    }

    /**
     * Transform features into encoded numeric array
     */
    public double[] transform(PropertyFeatures feature) {
        if (!isFitted) {
            throw new IllegalStateException("Encoder must be fitted before transform");
        }

        List<Double> encoded = new ArrayList<>();

        encoded.addAll(oneHotEncode(feature.getStatus(), categoryMappings.get("status")));

        encoded.addAll(oneHotEncode(feature.getPropertyType(), categoryMappings.get("property_type")));

        encoded.addAll(oneHotEncode(feature.getCity(), categoryMappings.get("city")));

        encoded.addAll(oneHotEncode(feature.getState(), categoryMappings.get("state")));

        encoded.add(standardize(feature.getBedrooms().doubleValue(),
                featureMeans.get("bedrooms"), featureStdDevs.get("bedrooms")));
        encoded.add(standardize(feature.getBathrooms().doubleValue(),
                featureMeans.get("bathrooms"), featureStdDevs.get("bathrooms")));
        encoded.add(standardize(feature.getSizeM2(),
                featureMeans.get("size_m2"), featureStdDevs.get("size_m2")));

        return encoded.stream().mapToDouble(Double::doubleValue).toArray();
    }

    /**
     * Fit and transform in one step
     */
    public List<double[]> fitTransform(List<PropertyFeatures> features) {
        fit(features);
        return features.stream()
                .map(this::transform)
                .collect(Collectors.toList());
    }

    /**
     * One-hot encode a categorical value
     */
    private List<Double> oneHotEncode(String value, List<String> categories) {
        List<Double> encoded = new ArrayList<>();
        for (String category : categories) {
            encoded.add(category.equals(value) ? 1.0 : 0.0);
        }
        return encoded;
    }

    /**
     * Standardize numerical feature: (x - mean) / std
     */
    private double standardize(double value, double mean, double stdDev) {
        if (stdDev == 0.0) {
            return 0.0;
        }
        return (value - mean) / stdDev;
    }

    private double calculateMean(List<Double> values) {
        return values.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
    }

    private double calculateStdDev(List<Double> values, double mean) {
        double variance = values.stream()
                .mapToDouble(v -> Math.pow(v - mean, 2))
                .average()
                .orElse(0.0);
        return Math.sqrt(variance);
    }


    public int getEncodedFeatureCount() {
        if (!isFitted) {
            return 0;
        }
        return categoryMappings.get("status").size() +
                categoryMappings.get("property_type").size() +
                categoryMappings.get("city").size() +
                categoryMappings.get("state").size() +
                3;
    }
}
