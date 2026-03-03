package com.pi.zanoraback.repository.mongo;

import com.pi.zanoraback.model.Review;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Aggregation;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends MongoRepository<Review, String> {

    List<Review> findByPropertyId(Long propertyId);

    List<Review> findByUserId(Long userId);

    Optional<Review> findByPropertyIdAndUserId(Long propertyId, Long userId);

    void deleteByPropertyId(Long propertyId);

    @Aggregation(pipeline = {
            "{ $match: { propertyId: ?0 } }",
            "{ $group: { _id: null, avgRating: { $avg: '$rating' } } }"
    })
    Double averageRatingByPropertyId(Long propertyId);
}