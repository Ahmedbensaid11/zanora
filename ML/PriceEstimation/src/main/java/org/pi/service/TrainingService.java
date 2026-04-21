package org.pi.service;

import org.pi.entity.Listing;
import org.pi.ml.ModelMetrics;
import io.quarkus.runtime.StartupEvent;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * Service for training and retraining the ML model
 */
@ApplicationScoped
public class TrainingService {

    private static final Logger LOG = Logger.getLogger(TrainingService.class);

    @Inject
    MLPredictionService mlService;

    @ConfigProperty(name = "ml.auto-train-on-startup", defaultValue = "true")
    boolean autoTrainOnStartup;

    @ConfigProperty(name = "ml.min-training-samples", defaultValue = "50")
    int minTrainingSamples;

    private LocalDateTime lastTrainingTime;
    private boolean isTraining = false;


    void onStart(@Observes StartupEvent ev) {
        if (autoTrainOnStartup) {
            LOG.info("Auto-training model on startup...");
            try {
                trainModel();
            } catch (Exception e) {
                LOG.error("Failed to auto-train model on startup", e);
            }
        }
    }


    @Scheduled(cron = "0 0 2 ? * SUN")
    @Transactional
    void scheduledRetraining() {
        LOG.info("Scheduled retraining triggered");
        try {
            trainModel();
        } catch (Exception e) {
            LOG.error("Scheduled retraining failed", e);
        }
    }

    /**
     * Train the model with all available listings
     */
    @Transactional
    public ModelMetrics trainModel() {
        if (isTraining) {
            LOG.warn("Training already in progress");
            return null;
        }

        try {
            isTraining = true;
            LOG.info("Starting model training...");

            // Fetch all listings with valid prices
            List<Listing> allListings = Listing.listAll();

            if (allListings.isEmpty()) {
                LOG.warn("No listings found in database");
                return null;
            }

            LOG.infof("Found %d listings in database", allListings.size());

            // Filter listings with valid prices
            List<Listing> validListings = allListings.stream()
                    .filter(l -> l.getPriceNumeric() != null && l.getPriceNumeric() > 0)
                    .toList();

            LOG.infof("Filtered to %d listings with valid prices", validListings.size());

            if (validListings.size() < minTrainingSamples) {
                LOG.warnf("Insufficient data for training. Found %d samples, need at least %d",
                        validListings.size(), minTrainingSamples);

                // If we have some data but not enough, enhance it
                if (validListings.size() > 0) {
                    LOG.info("Enhancing dataset with synthetic data...");
                    List<Listing> enhanced = enhanceDataset(validListings);
                    ModelMetrics metrics = mlService.trainModel(enhanced);
                    lastTrainingTime = LocalDateTime.now();
                    return metrics;
                }

                return null;
            }

            ModelMetrics metrics = mlService.trainModel(validListings);
            lastTrainingTime = LocalDateTime.now();

            LOG.info("Model training completed successfully");
            return metrics;

        } finally {
            isTraining = false;
        }
    }


    private List<Listing> enhanceDataset(List<Listing> originalListings) {
        LOG.info("Generating synthetic data to augment training set...");

        List<Listing> enhanced = new ArrayList<>(originalListings);

        int syntheticCount = Math.max(minTrainingSamples - originalListings.size(),
                originalListings.size());

        Random random = new Random(42);

        for (int i = 0; i < syntheticCount; i++) {
            Listing template = originalListings.get(random.nextInt(originalListings.size()));

            Listing synthetic = new Listing();
            synthetic.setStatus(template.getStatus());
            synthetic.setPropertyType(template.getPropertyType());
            synthetic.setCity(template.getCity());
            synthetic.setState(template.getState());

            int bedrooms = template.getBedrooms() != null ? template.getBedrooms() : 2;
            bedrooms = Math.max(1, Math.min(5, bedrooms + random.nextInt(3) - 1));
            synthetic.setBedrooms(bedrooms);

            int bathrooms = template.getBathrooms() != null ? template.getBathrooms() : 1;
            bathrooms = Math.max(1, Math.min(3, bathrooms + random.nextInt(3) - 1));
            synthetic.setBathrooms(bathrooms);

            double size = template.getSizeM2Numeric();
            size = size * (0.8 + random.nextDouble() * 0.4); // 80% to 120% of original
            synthetic.setSizeM2(String.valueOf(Math.round(size)));

            double basePrice = calculateSyntheticPrice(synthetic);
            basePrice = basePrice * (0.9 + random.nextDouble() * 0.2); // Add 10% variation
            synthetic.setPrice(String.valueOf(Math.round(basePrice)));

            enhanced.add(synthetic);
        }

        LOG.infof("Enhanced dataset: %d original + %d synthetic = %d total",
                originalListings.size(), syntheticCount, enhanced.size());

        return enhanced;
    }

    private double calculateSyntheticPrice(Listing listing) {
        double basePricePerM2 = 50.0;

        String propType = listing.getStandardizedPropertyType();
        switch (propType) {
            case "Maison Villa": basePricePerM2 = 80.0; break;
            case "Bureaux": basePricePerM2 = 60.0; break;
            case "Locaux Commerciaux": basePricePerM2 = 70.0; break;
        }

        if ("À vendre".equals(listing.getStatus())) {
            basePricePerM2 *= 120;
        }

        double cityMultiplier = 1.0;
        if (listing.getCity() != null) {
            switch (listing.getCity()) {
                case "La Marsa": cityMultiplier = 1.5; break;
                case "Tunis": cityMultiplier = 1.2; break;
                case "Ariana": cityMultiplier = 1.1; break;
                case "Sfax": cityMultiplier = 0.9; break;
                case "Sousse": cityMultiplier = 0.8; break;
            }
        }

        double size = listing.getSizeM2Numeric();
        int bedrooms = listing.getBedrooms() != null ? listing.getBedrooms() : 2;
        int bathrooms = listing.getBathrooms() != null ? listing.getBathrooms() : 1;

        return size * basePricePerM2 * cityMultiplier *
                (1 + (bedrooms - 2) * 0.1) *
                (1 + (bathrooms - 1) * 0.05);
    }

    public LocalDateTime getLastTrainingTime() {
        return lastTrainingTime;
    }

    public boolean isTraining() {
        return isTraining;
    }
}