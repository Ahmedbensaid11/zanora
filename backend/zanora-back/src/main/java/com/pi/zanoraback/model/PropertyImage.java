package com.pi.zanoraback.model;


import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "property_images")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PropertyImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    @Column(nullable = false, columnDefinition = "bytea")
    private byte[] data;

    @Column(nullable = false)
    private String contentType; // e.g. "image/jpeg", "image/png"

    private boolean isPrimary = false;
}