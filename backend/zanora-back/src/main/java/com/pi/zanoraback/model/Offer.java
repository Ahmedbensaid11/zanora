package com.pi.zanoraback.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "offers")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Offer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OfferType type;

    @Column(nullable = false)
    private Float proposedPrice;

    // Only relevant when type = RENT
    private LocalDateTime rentStartDate;
    private LocalDateTime rentEndDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OfferStatus status;

    private String message; // optional note from buyer

    private String ownerNote; // optional note from owner when accepting/declining

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime respondedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) this.status = OfferStatus.PENDING;
    }
}