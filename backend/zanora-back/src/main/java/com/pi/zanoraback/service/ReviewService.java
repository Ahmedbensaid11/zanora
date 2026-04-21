package com.pi.zanoraback.service;

import com.pi.zanoraback.dto.ReviewDTO;
import com.pi.zanoraback.exception.DuplicateReviewException;
import com.pi.zanoraback.exception.ReviewNotFoundException;
import com.pi.zanoraback.exception.ReviewUnauthorizedException;
import com.pi.zanoraback.model.Property;
import com.pi.zanoraback.model.Review;
import com.pi.zanoraback.model.User;
import com.pi.zanoraback.repository.jpa.PropertyRepository;
import com.pi.zanoraback.repository.jpa.UserRepository;
import com.pi.zanoraback.repository.mongo.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final NotificationService notificationService; // ← NEW

    public Review createReview(ReviewDTO dto) {
        User currentUser = userService.getCurrentlyAuthenticatedUser();
        Long userId = currentUser.getId();

        Property property = propertyRepository.findById(dto.getPropertyId())
                .orElseThrow(() -> new RuntimeException(
                        "Property not found with id: " + dto.getPropertyId()));

        reviewRepository.findByPropertyIdAndUserId(dto.getPropertyId(), userId)
                .ifPresent(r -> {
                    throw new DuplicateReviewException(
                            "You have already reviewed this property");
                });

        Review review = Review.builder()
                .propertyId(dto.getPropertyId())
                .userId(userId)
                .rating(dto.getRating())
                .comment(dto.getComment())
                .createdAt(LocalDateTime.now())
                .build();

        Review saved = enrich(reviewRepository.save(review));

        // ── Notify the property owner ────────────────────────────────────────
        notificationService.notifyOwnerOfNewReview(
                currentUser.getUsername(),
                property.getOwner(),
                property.getId(),
                property.getTitle(),
                saved.getId()          // MongoDB ObjectId string
        );

        return saved;
    }

    public Review updateReview(String reviewId, Long userId, ReviewDTO dto) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ReviewNotFoundException(
                        "Review not found with id: " + reviewId));

        if (!review.getUserId().equals(userId)) {
            throw new ReviewUnauthorizedException(
                    "Unauthorized: You did not write this review");
        }

        review.setRating(dto.getRating());
        review.setComment(dto.getComment());
        review.setEdited(true);
        review.setUpdatedAt(LocalDateTime.now());

        return enrich(reviewRepository.save(review));
    }

    public void deleteReview(String reviewId, Long userId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new ReviewNotFoundException(
                        "Review not found with id: " + reviewId));

        if (!review.getUserId().equals(userId)) {
            throw new ReviewUnauthorizedException(
                    "Unauthorized: You did not write this review");
        }

        reviewRepository.delete(review);
    }

    public List<Review> getReviewsByProperty(Long propertyId, String sortBy,
                                             String direction) {
        Sort.Direction sortDirection =
                direction != null && direction.equalsIgnoreCase("asc")
                        ? Sort.Direction.ASC
                        : Sort.Direction.DESC;

        String sortField = "rating".equals(sortBy) ? "rating" : "createdAt";

        return reviewRepository
                .findByPropertyId(propertyId, Sort.by(sortDirection, sortField))
                .stream()
                .map(this::enrich)
                .toList();
    }

    public Double getAverageRating(Long propertyId) {
        return reviewRepository.averageRatingByPropertyId(propertyId);
    }

    private Review enrich(Review review) {
        userRepository.findById(review.getUserId()).ifPresent(user -> {
            review.setUsername(user.getUsername());
            review.setProfileImg(user.getProfileImg());
        });
        return review;
    }

    public boolean hasReviewed(Long propertyId) {
        Long userId = userService.getCurrentlyAuthenticatedUser().getId();
        return reviewRepository.findByPropertyIdAndUserId(propertyId, userId).isPresent();
    }

    public boolean isReviewAuthor(String reviewId) {
        Long userId = userService.getCurrentlyAuthenticatedUser().getId();
        return reviewRepository.findById(reviewId)
                .map(review -> review.getUserId().equals(userId))
                .orElseThrow(() -> new ReviewNotFoundException("Review not found with id: " + reviewId));
    }
}