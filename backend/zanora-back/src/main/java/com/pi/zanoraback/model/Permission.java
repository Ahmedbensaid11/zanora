package com.pi.zanoraback.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "permissions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Permission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(length = 255)
    private String description;

    @Column(name = "resource", length = 50)
    private String resource; // e.g., "USER", "PROJECT", "REPORT"

    @Column(name = "action", length = 50)
    private String action; // e.g., "CREATE", "READ", "UPDATE", "DELETE"

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;
}