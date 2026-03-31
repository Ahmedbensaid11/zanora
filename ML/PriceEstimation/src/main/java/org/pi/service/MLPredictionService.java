package org.pi.service;

import org.pi.entity.Listing;
import org.pi.ml.*;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

import java.util.*;
import java.util.stream.Collectors;


@ApplicationScoped
public class MLPredictionService {

    private static final Logger LOG = Logger.getLogger(MLPredictionService.class);

    @Inject
    FeatureEncoder featureEncoder;

    private RandomForestRegressor model;
    private Map<Integer, ClusterInfo> clusterStats = new HashMap<>();
    private boolean isModelTrained = false;
    private ModelMetrics modelMetrics;

    void onStart(@Observes StartupEvent ev) {
        LOG.info("ML Prediction Service starting up...");
    }


    @Transactional
    public ModelMetrics trainModel(List<Listing> listings) {
        LOG.info("========================================");
        LOG.info("TRAINING MACHINE LEARNING MODEL");
        LOG.info("========================================");

        if (listings == null || listings.isEmpty()) {
            LOG.warn("No training data provided");
            return null;
        }

        // Prepare training data
        TrainingData trainingData = prepareTrainingData(listings);

        if (trainingData.size() < 10) {
            LOG.warn("Insufficient training data: " + trainingData.size() + " samples");
            return null;
        }

        LOG.infof("Prepared %d training samples", trainingData.size());

        // Encode features
        List<double[]> encodedFeatures = featureEncoder.fitTransform(trainingData.getFeatures());
        double[][] X = encodedFeatures.toArray(new double[0][]);
        double[] y = trainingData.getPrices().stream()
                .mapToDouble(Double::doubleValue)
                .toArray();

        int trainSize = (int) (X.length * 0.8);
        double[][] XTrain = Arrays.copyOfRange(X, 0, trainSize);
        double[] yTrain = Arrays.copyOfRange(y, 0, trainSize);
        double[][] XTest = Arrays.copyOfRange(X, trainSize, X.length);
        double[] yTest = Arrays.copyOfRange(y, trainSize, y.length);

        LOG.infof("Training set: %d samples, Test set: %d samples", trainSize, X.length - trainSize);

        model = new RandomForestRegressor(100, 10, 5);
        model.train(XTrain, yTrain);

        double mae = model.calculateMAE(XTest, yTest);
        double rmse = model.calculateRMSE(XTest, yTest);
        double r2 = model.calculateR2(XTest, yTest);

        modelMetrics = new ModelMetrics(mae, rmse, r2, trainSize, X.length - trainSize, "Random Forest");

        LOG.info("========================================");
        LOG.info("MODEL PERFORMANCE");
        LOG.info("========================================");
        LOG.infof("Training Set Size: %d", trainSize);
        LOG.infof("Test Set Size: %d", X.length - trainSize);
        LOG.infof("Mean Absolute Error: %.2f DT", mae);
        LOG.infof("Root Mean Squared Error: %.2f DT", rmse);
        LOG.infof("R² Score: %.4f", r2);
        LOG.info("========================================");

        createClusters(trainingData.getFeatures(), y);

        isModelTrained = true;

        return modelMetrics;
    }


    public PredictionResult predictPrice(PropertyFeatures features) {
        if (!isModelTrained) {
            LOG.warn("Model not trained, using fallback prediction");
            return createFallbackPrediction(features);
        }

        try {
            // Encode features
            double[] encoded = featureEncoder.transform(features);

            RandomForestRegressor.PredictionWithConfidence prediction =
                    model.predictWithConfidence(encoded);

            Integer cluster = findCluster(features);
            ClusterInfo clusterInfo = clusterStats.get(cluster);

            PredictionResult result = new PredictionResult(prediction.prediction);
            result.setLowerBound(prediction.lowerBound);
            result.setUpperBound(prediction.upperBound);
            result.setPriceRange(String.format("%.0f - %.0f DT",
                    prediction.lowerBound, prediction.upperBound));
            result.setCluster(cluster);

            if (clusterInfo != null) {
                result.setSimilarPropertiesCount(clusterInfo.getCount());
                double priceDiff = Math.abs(prediction.prediction - clusterInfo.getAveragePrice())
                        / clusterInfo.getAveragePrice() * 100;
                result.setPriceDifferencePercent(priceDiff);

                if (priceDiff < 10) {
                    result.setConfidence("HIGH");
                } else if (priceDiff < 25) {
                    result.setConfidence("MEDIUM");
                } else {
                    result.setConfidence("LOW");
                }
            } else {
                result.setConfidence("MEDIUM");
            }

            return result;

        } catch (Exception e) {
            LOG.error("Error during prediction", e);
            return createFallbackPrediction(features);
        }
    }


    private TrainingData prepareTrainingData(List<Listing> listings) {
        List<PropertyFeatures> features = new ArrayList<>();
        List<Double> prices = new ArrayList<>();

        for (Listing listing : listings) {
            Double price = listing.getPriceNumeric();
            if (price == null || price <= 0) {
                continue;
            }

            // Filter extreme outliers (below 1st percentile or above 99th percentile)
            // This will be done after collecting all prices
            PropertyFeatures feature = new PropertyFeatures(
                    listing.getStatus(),
                    listing.getStandardizedPropertyType(),
                    listing.getCity() != null ? listing.getCity() : "Tunis",
                    listing.getState() != null ? listing.getState() : "Tunis",
                    listing.getBedrooms() != null ? listing.getBedrooms() : 2,
                    listing.getBathrooms() != null ? listing.getBathrooms() : 1,
                    listing.getSizeM2Numeric()
            );

            features.add(feature);
            prices.add(price);
        }

        // Remove price outliers
        if (prices.size() > 10) {
            List<Double> sortedPrices = new ArrayList<>(prices);
            Collections.sort(sortedPrices);

            int p1Index = (int) (sortedPrices.size() * 0.01);
            int p99Index = (int) (sortedPrices.size() * 0.99);

            double p1 = sortedPrices.get(p1Index);
            double p99 = sortedPrices.get(p99Index);

            List<PropertyFeatures> filteredFeatures = new ArrayList<>();
            List<Double> filteredPrices = new ArrayList<>();

            for (int i = 0; i < prices.size(); i++) {
                double price = prices.get(i);
                if (price >= p1 && price <= p99) {
                    filteredFeatures.add(features.get(i));
                    filteredPrices.add(price);
                }
            }

            LOG.infof("Filtered outliers: %d -> %d samples", prices.size(), filteredPrices.size());
            features = filteredFeatures;
            prices = filteredPrices;
        }

        return new TrainingData(features, prices);
    }

    private void createClusters(List<PropertyFeatures> features, double[] prices) {
        Map<String, List<Double>> clusterPrices = new HashMap<>();
        Map<String, List<Double>> clusterSizes = new HashMap<>();

        for (int i = 0; i < features.size(); i++) {
            PropertyFeatures f = features.get(i);
            String key = f.getPropertyType() + "|" + f.getCity();

            clusterPrices.computeIfAbsent(key, k -> new ArrayList<>()).add(prices[i]);
            clusterSizes.computeIfAbsent(key, k -> new ArrayList<>()).add(f.getSizeM2());
        }

        int clusterId = 0;
        for (Map.Entry<String, List<Double>> entry : clusterPrices.entrySet()) {
            String[] parts = entry.getKey().split("\\|");
            String propertyType = parts[0];
            String city = parts[1];

            List<Double> priceList = entry.getValue();
            List<Double> sizeList = clusterSizes.get(entry.getKey());

            double avgPrice = priceList.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
            double avgSize = sizeList.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);

            ClusterInfo info = new ClusterInfo();
            info.setClusterId(clusterId);
            info.setAveragePrice(avgPrice);
            info.setCount(priceList.size());
            info.setAverageSize(avgSize);
            info.setDominantPropertyType(propertyType);
            info.setDominantCity(city);

            clusterStats.put(clusterId, info);
            clusterId++;
        }

        LOG.infof("Created %d clusters for analysis", clusterStats.size());
    }


    private Integer findCluster(PropertyFeatures features) {
        String key = features.getPropertyType() + "|" + features.getCity();

        for (Map.Entry<Integer, ClusterInfo> entry : clusterStats.entrySet()) {
            ClusterInfo info = entry.getValue();
            if (info.getDominantPropertyType().equals(features.getPropertyType()) &&
                    info.getDominantCity().equals(features.getCity())) {
                return entry.getKey();
            }
        }

        return -1;
    }

    /**
     * Fallback prediction using rule-based logic
     */
    private PredictionResult createFallbackPrediction(PropertyFeatures features) {
        LOG.info("Using fallback prediction");

        double basePricePerM2 = 50.0; // Default for rent

        // Adjust for property type
        switch (features.getPropertyType()) {
            case "Maison Villa":
                basePricePerM2 = 80.0;
                break;
            case "Bureaux":
                basePricePerM2 = 60.0;
                break;
            case "Locaux Commerciaux":
                basePricePerM2 = 70.0;
                break;
        }

        // Adjust for sale vs rent
        if ("À vendre".equals(features.getStatus())) {
            basePricePerM2 *= 120;
        }

        // City multipliers
        double cityMultiplier = switch (features.getCity()) {
            case "La Marsa" -> 1.5;
            case "Tunis" -> 1.2;
            case "Ariana" -> 1.1;
            case "Sfax" -> 0.9;
            case "Sousse" -> 0.8;
            default -> 1.0;
        };

        double price = features.getSizeM2() * basePricePerM2 * cityMultiplier *
                (1 + (features.getBedrooms() - 2) * 0.1) *
                (1 + (features.getBathrooms() - 1) * 0.05);

        PredictionResult result = new PredictionResult(price);
        result.setNote("Fallback prediction - Model not trained");
        result.setConfidence("LOW");

        return result;
    }

    public boolean isModelTrained() {
        return isModelTrained;
    }

    public ModelMetrics getModelMetrics() {
        return modelMetrics;
    }

    public Map<Integer, ClusterInfo> getClusterStats() {
        return clusterStats;
    }
}