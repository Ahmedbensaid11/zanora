package com.pi.zanoraback.controller;


import com.pi.zanoraback.dto.CreatePropertyDTO;
import com.pi.zanoraback.model.Property;
import com.pi.zanoraback.service.PropertyService;
import com.pi.zanoraback.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
@CrossOrigin(
        origins = {"http://localhost:5173", "http://localhost:8081"},
        allowCredentials = "true"
)
@RestController
@RequestMapping("/api/properties")
@RequiredArgsConstructor
public class PropertyController {

    private final PropertyService propertyService;
    private final UserService userService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Property> createProperty(
            @Valid @ModelAttribute CreatePropertyDTO dto) throws IOException {
        Long ownerId = userService.getCurrentlyAuthenticatedUser().getId();
        Property created = propertyService.createProperty(dto, ownerId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
    @DeleteMapping("/{propertyId}")
    public ResponseEntity<Void> deleteProperty(
            @PathVariable Long propertyId
            ) {
        Long ownerId = userService.getCurrentlyAuthenticatedUser().getId();
        propertyService.deleteProperty(propertyId, ownerId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping(value = "/{propertyId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Property> updateProperty(
            @PathVariable Long propertyId,
            @Valid @ModelAttribute CreatePropertyDTO dto) throws IOException {
        Long ownerId = userService.getCurrentlyAuthenticatedUser().getId();
        Property updated = propertyService.updateProperty(propertyId, ownerId, dto);
        return ResponseEntity.ok(updated);
    }
    @GetMapping("/{propertyId}/is-owner")
    public ResponseEntity<Boolean> isOwner(@PathVariable Long propertyId) {
        Long currentUserId = userService.getCurrentlyAuthenticatedUser().getId();
        boolean result = propertyService.isOwner(propertyId, currentUserId);
        return ResponseEntity.ok(result);
    }
}