package org.pi.resource;

import org.pi.entity.Listing;
import org.pi.ml.*;
import org.pi.service.MLPredictionService;
import org.pi.service.TrainingService;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.jboss.logging.Logger;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Path("/api")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Real Estate Price Prediction", description = "ML-powered price prediction API")
public class PredictionResource {

    private static final Logger LOG = Logger.getLogger(PredictionResource.class);

    @Inject
    MLPredictionService mlService;

    @Inject
    TrainingService trainingService;

    @GET
    @Path("/health")
    @Operation(summary = "Health check for ML model")
    @APIResponse(responseCode = "200", description = "Service health status")
    public Response health() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", mlService.isModelTrained() ? "healthy" : "untrained");
        status.put("model_trained", mlService.isModelTrained());
        status.put("last_training", trainingService.getLastTrainingTime());
        status.put("is_training", trainingService.isTraining());

        if (mlService.isModelTrained() && mlService.getModelMetrics() != null) {
            status.put("metrics", mlService.getModelMetrics());
        }

        return Response.ok(status).build();
    }

    @POST
    @Path("/predictions/train")
    @Transactional
    @Operation(summary = "Train/retrain the ML model")
    @APIResponse(responseCode = "200", description = "Training completed",
            content = @Content(schema = @Schema(implementation = ModelMetrics.class)))
    public Response trainModel() {
        try {
            if (trainingService.isTraining()) {
                return Response.status(Response.Status.CONFLICT)
                        .entity(Map.of("error", "Training already in progress"))
                        .build();
            }

            LOG.info("Manual training triggered via API");
            ModelMetrics metrics = trainingService.trainModel();

            if (metrics == null) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", "Insufficient training data"))
                        .build();
            }

            return Response.ok(metrics).build();

        } catch (Exception e) {
            LOG.error("Error during training", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @POST
    @Path("/predictions/predict")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(summary = "Predict price for custom property")
    @APIResponse(responseCode = "200", description = "Price prediction",
            content = @Content(schema = @Schema(implementation = PredictionResult.class)))
    public Response predictCustom(PropertyRequest request) {
        try {
            LOG.infof("Prediction request: %s in %s", request.propertyType, request.city);

            PropertyFeatures features = new PropertyFeatures(
                    request.status,
                    request.propertyType,
                    request.city,
                    request.state,
                    request.bedrooms,
                    request.bathrooms,
                    request.sizeM2
            );

            PredictionResult result = mlService.predictPrice(features);

            return Response.ok(result).build();

        } catch (Exception e) {
            LOG.error("Error in prediction", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @GET
    @Path("/predictions/listing/{id}")
    @Transactional
    @Operation(summary = "Predict price for existing listing")
    @APIResponse(responseCode = "200", description = "Listing with prediction")
    public Response predictForListing(@PathParam("id") Long id) {
        try {
            Listing listing = Listing.findById(id);

            if (listing == null) {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity(Map.of("error", "Listing not found"))
                        .build();
            }

            PropertyFeatures features = new PropertyFeatures(
                    listing.getStatus(),
                    listing.getStandardizedPropertyType(),
                    listing.getCity(),
                    listing.getState(),
                    listing.getBedrooms(),
                    listing.getBathrooms(),
                    listing.getSizeM2Numeric()
            );

            PredictionResult prediction = mlService.predictPrice(features);

            ListingWithPrediction response = new ListingWithPrediction();
            response.listingId = listing.id;
            response.title = listing.getTitle();
            response.propertyType = listing.getPropertyType();
            response.city = listing.getCity();
            response.status = listing.getStatus();
            response.bedrooms = listing.getBedrooms();
            response.bathrooms = listing.getBathrooms();
            response.sizeM2 = listing.getSizeM2Numeric();
            response.actualPrice = listing.getPriceNumeric();
            response.prediction = prediction;

            if (response.actualPrice != null && prediction.getPredictedPrice() != null) {
                response.accuracyPercent = 100 - Math.abs(
                        (prediction.getPredictedPrice() - response.actualPrice) /
                                response.actualPrice * 100);
            }

            return Response.ok(response).build();

        } catch (Exception e) {
            LOG.error("Error predicting for listing", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @POST
    @Path("/predictions/batch")
    @Transactional
    @Operation(summary = "Batch prediction for multiple listings")
    public Response batchPredict(BatchRequest request) {
        try {
            if (request.listingIds == null || request.listingIds.isEmpty()) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", "listingIds required"))
                        .build();
            }

            List<ListingWithPrediction> results = new ArrayList<>();

            for (Long id : request.listingIds) {
                Listing listing = Listing.findById(id);
                if (listing != null) {
                    PropertyFeatures features = new PropertyFeatures(
                            listing.getStatus(),
                            listing.getStandardizedPropertyType(),
                            listing.getCity(),
                            listing.getState(),
                            listing.getBedrooms(),
                            listing.getBathrooms(),
                            listing.getSizeM2Numeric()
                    );

                    PredictionResult prediction = mlService.predictPrice(features);

                    ListingWithPrediction item = new ListingWithPrediction();
                    item.listingId = listing.id;
                    item.title = listing.getTitle();
                    item.propertyType = listing.getPropertyType();
                    item.city = listing.getCity();
                    item.prediction = prediction;

                    results.add(item);
                }
            }

            return Response.ok(results).build();

        } catch (Exception e) {
            LOG.error("Error in batch prediction", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @GET
    @Path("/predictions/statistics")
    @Transactional
    @Operation(summary = "Get prediction statistics")
    public Response getStatistics(
            @QueryParam("city") String city,
            @QueryParam("property_type") String propertyType,
            @QueryParam("status") String status) {

        try {
            List<Listing> listings = Listing.listAll();

            // Apply filters
            if (city != null && !city.isEmpty()) {
                listings = listings.stream()
                        .filter(l -> city.equals(l.getCity()))
                        .collect(Collectors.toList());
            }
            if (propertyType != null && !propertyType.isEmpty()) {
                listings = listings.stream()
                        .filter(l -> propertyType.equals(l.getPropertyType()))
                        .collect(Collectors.toList());
            }
            if (status != null && !status.isEmpty()) {
                listings = listings.stream()
                        .filter(l -> status.equals(l.getStatus()))
                        .collect(Collectors.toList());
            }

            if (listings.isEmpty()) {
                return Response.ok(Map.of("message", "No listings found")).build();
            }

            // Get predictions
            List<Double> predictions = new ArrayList<>();
            Map<String, List<Double>> byCity = new HashMap<>();
            Map<String, List<Double>> byType = new HashMap<>();

            for (Listing listing : listings) {
                try {
                    PropertyFeatures features = new PropertyFeatures(
                            listing.getStatus(),
                            listing.getStandardizedPropertyType(),
                            listing.getCity(),
                            listing.getState(),
                            listing.getBedrooms(),
                            listing.getBathrooms(),
                            listing.getSizeM2Numeric()
                    );

                    PredictionResult result = mlService.predictPrice(features);
                    predictions.add(result.getPredictedPrice());

                    byCity.computeIfAbsent(listing.getCity(), k -> new ArrayList<>())
                            .add(result.getPredictedPrice());

                    byType.computeIfAbsent(listing.getStandardizedPropertyType(),
                                    k -> new ArrayList<>())
                            .add(result.getPredictedPrice());

                } catch (Exception e) {
                    LOG.warnf("Failed prediction for listing %d", listing.id);
                }
            }

            StatisticsResponse stats = new StatisticsResponse();
            stats.totalListings = (long) predictions.size();
            stats.averagePrice = predictions.stream().mapToDouble(Double::doubleValue).average().orElse(0);
            stats.minPrice = predictions.stream().mapToDouble(Double::doubleValue).min().orElse(0);
            stats.maxPrice = predictions.stream().mapToDouble(Double::doubleValue).max().orElse(0);

            stats.averagePriceByCity = byCity.entrySet().stream()
                    .collect(Collectors.toMap(
                            Map.Entry::getKey,
                            e -> e.getValue().stream().mapToDouble(Double::doubleValue).average().orElse(0)
                    ));

            stats.averagePriceByType = byType.entrySet().stream()
                    .collect(Collectors.toMap(
                            Map.Entry::getKey,
                            e -> e.getValue().stream().mapToDouble(Double::doubleValue).average().orElse(0)
                    ));

            return Response.ok(stats).build();

        } catch (Exception e) {
            LOG.error("Error calculating statistics", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @GET
    @Path("/predictions/clusters")
    @Operation(summary = "Get cluster information")
    public Response getClusters() {
        if (!mlService.isModelTrained()) {
            return Response.status(Response.Status.SERVICE_UNAVAILABLE)
                    .entity(Map.of("error", "Model not trained"))
                    .build();
        }

        return Response.ok(mlService.getClusterStats().values()).build();
    }

    @GET
    @Path("/listings")
    @Transactional
    @Operation(summary = "List all properties with filters")
    public Response listListings(
            @QueryParam("city") String city,
            @QueryParam("property_type") String propertyType,
            @QueryParam("status") String status,
            @QueryParam("min_bedrooms") Integer minBedrooms,
            @QueryParam("max_bedrooms") Integer maxBedrooms,
            @QueryParam("limit") @DefaultValue("50") int limit) {

        List<Listing> listings = Listing.listAll();

        if (city != null) {
            listings = listings.stream().filter(l -> city.equals(l.getCity())).collect(Collectors.toList());
        }
        if (propertyType != null) {
            listings = listings.stream().filter(l -> propertyType.equals(l.getPropertyType())).collect(Collectors.toList());
        }
        if (status != null) {
            listings = listings.stream().filter(l -> status.equals(l.getStatus())).collect(Collectors.toList());
        }
        if (minBedrooms != null) {
            listings = listings.stream().filter(l -> l.getBedrooms() != null && l.getBedrooms() >= minBedrooms).collect(Collectors.toList());
        }
        if (maxBedrooms != null) {
            listings = listings.stream().filter(l -> l.getBedrooms() != null && l.getBedrooms() <= maxBedrooms).collect(Collectors.toList());
        }

        return Response.ok(listings.stream().limit(limit).collect(Collectors.toList())).build();
    }


    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PropertyRequest {
        public String status;
        public String propertyType;
        public String city;
        public String state;
        public Integer bedrooms;
        public Integer bathrooms;
        public Double sizeM2;
    }

    @Data
    public static class ListingWithPrediction {
        public Long listingId;
        public String title;
        public String propertyType;
        public String city;
        public String status;
        public Integer bedrooms;
        public Integer bathrooms;
        public Double sizeM2;
        public Double actualPrice;
        public PredictionResult prediction;
        public Double accuracyPercent;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BatchRequest {
        public List<Long> listingIds;
    }

    @Data
    public static class StatisticsResponse {
        public Long totalListings;
        public Double averagePrice;
        public Double minPrice;
        public Double maxPrice;
        public Map<String, Double> averagePriceByCity;
        public Map<String, Double> averagePriceByType;
    }
}
