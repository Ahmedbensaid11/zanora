package com.pi.zanoraback.service;


import com.pi.zanoraback.dto.ReviewDTO;
import com.pi.zanoraback.model.Review;
import com.pi.zanoraback.repository.mongo.ReviewRepository;
import com.pi.zanoraback.repository.jpa.UserRepository;
import com.pi.zanoraback.repository.jpa.PropertyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;

    public Review createReview(ReviewDTO dto) {
        // Validate both exist in PostgreSQL
        userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        propertyRepository.findById(dto.getPropertyId())
                .orElseThrow(() -> new RuntimeException("Property not found"));

        // One review per user per property
        reviewRepository.findByPropertyIdAndUserId(dto.getPropertyId(), dto.getUserId())
                .ifPresent(r -> { throw new RuntimeException("You have already reviewed this property"); });

        Review review = Review.builder()
                .propertyId(dto.getPropertyId())
                .userId(dto.getUserId())
                .rating(dto.getRating())
                .comment(dto.getComment())
                .createdAt(LocalDateTime.now())
                .build();

        return reviewRepository.save(review);
    }

    public Review updateReview(String reviewId, Long userId, ReviewDTO dto) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        if (!review.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized: You did not write this review");
        }

        review.setRating(dto.getRating());
        review.setComment(dto.getComment());
        review.setEdited(true);

        return reviewRepository.save(review);
    }

    public void deleteReview(String reviewId, Long userId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found"));

        if (!review.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized: You did not write this review");
        }

        reviewRepository.delete(review);
    }

    public List<Review> getReviewsByProperty(Long propertyId) {
        return reviewRepository.findByPropertyId(propertyId);
    }

    public Double getAverageRating(Long propertyId) {
        return reviewRepository.averageRatingByPropertyId(propertyId);
    }
}