package com.pi.zanoraback.controller;

import com.pi.zanoraback.dto.ReviewDTO;
import com.pi.zanoraback.exception.ReviewNotFoundException;
import com.pi.zanoraback.model.Review;
import com.pi.zanoraback.model.User;
import com.pi.zanoraback.repository.mongo.ReviewRepository;
import com.pi.zanoraback.service.ReviewService;
import com.pi.zanoraback.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.repository.support.SimpleJpaRepository;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(
        origins = {"http://localhost:5173", "http://localhost:8081"},
        allowCredentials = "true"
)
@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;
    private final UserService userService;

    @PostMapping
    public ResponseEntity<Review> createReview(@Valid @RequestBody ReviewDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reviewService.createReview(dto));
    }

    @PutMapping("/{reviewId}")
    public ResponseEntity<Review> updateReview(
            @PathVariable String reviewId,
            @Valid @RequestBody ReviewDTO dto) {
        User currentUser = userService.getCurrentlyAuthenticatedUser();
        return ResponseEntity.ok(reviewService.updateReview(reviewId, currentUser.getId(), dto));
    }

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<Void> deleteReview(@PathVariable String reviewId) {
        User currentUser = userService.getCurrentlyAuthenticatedUser();
        reviewService.deleteReview(reviewId, currentUser.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/property/{propertyId}")
    public ResponseEntity<List<Review>> getPropertyReviews(
            @PathVariable Long propertyId,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
        return ResponseEntity.ok(reviewService.getReviewsByProperty(propertyId, sortBy, direction));
    }

    @GetMapping("/property/{propertyId}/rating")
    public ResponseEntity<Double> getAverageRating(@PathVariable Long propertyId) {
        return ResponseEntity.ok(reviewService.getAverageRating(propertyId));
    }
    @GetMapping("/property/{propertyId}/has-reviewed")
    public ResponseEntity<Boolean> hasReviewed(@PathVariable Long propertyId) {
        return ResponseEntity.ok(reviewService.hasReviewed(propertyId));
    }

    @GetMapping("/{reviewId}/is-author")
    public ResponseEntity<Boolean> isReviewAuthor(@PathVariable String reviewId) {
        return ResponseEntity.ok(reviewService.isReviewAuthor(reviewId));
    }
}