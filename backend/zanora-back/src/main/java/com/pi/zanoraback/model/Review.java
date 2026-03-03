package com.pi.zanoraback.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

@Document(collection = "reviews")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Review {

    @Id
    private String id;

    @Indexed
    private Long propertyId;   // FK to PostgreSQL property

    @Indexed
    private Long userId;       // FK to PostgreSQL user

    private String username;   // denormalized for fast reads

    private int rating;        // 1–5

    private String comment;

    private LocalDateTime createdAt;

    @Builder.Default
    private boolean edited = false;
}