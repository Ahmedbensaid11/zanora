package com.pi.zanoraback.controller;

import com.pi.zanoraback.dto.ReviewDTO;
import com.pi.zanoraback.model.Review;
import com.pi.zanoraback.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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

    @PostMapping
    public ResponseEntity<Review> createReview(@Valid @RequestBody ReviewDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reviewService.createReview(dto));
    }

    @PutMapping("/{reviewId}")
    public ResponseEntity<Review> updateReview(
            @PathVariable String reviewId,
            @RequestParam Long userId,
            @Valid @RequestBody ReviewDTO dto) {
        return ResponseEntity.ok(reviewService.updateReview(reviewId, userId, dto));
    }

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<Void> deleteReview(
            @PathVariable String reviewId,
            @RequestParam Long userId) {
        reviewService.deleteReview(reviewId, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/property/{propertyId}")
    public ResponseEntity<List<Review>> getPropertyReviews(@PathVariable Long propertyId) {
        return ResponseEntity.ok(reviewService.getReviewsByProperty(propertyId));
    }

    @GetMapping("/property/{propertyId}/rating")
    public ResponseEntity<Double> getAverageRating(@PathVariable Long propertyId) {
        return ResponseEntity.ok(reviewService.getAverageRating(propertyId));
    }
}