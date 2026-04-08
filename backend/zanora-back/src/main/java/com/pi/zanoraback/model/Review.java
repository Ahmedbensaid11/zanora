package com.pi.zanoraback.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "reviews")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Review {

    @Id
    private String id;

    private Long propertyId;
    private Long userId;
    private int rating;
    private String comment;
    private boolean edited;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // ── Populated at query time from PostgreSQL — not persisted in Mongo ──
    @Transient
    private String username;

    @Transient
    private byte[] profileImg;
}