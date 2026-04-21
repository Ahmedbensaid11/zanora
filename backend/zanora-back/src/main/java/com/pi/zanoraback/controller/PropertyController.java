package com.pi.zanoraback.controller;


import com.pi.zanoraback.dto.CreatePropertyDTO;
import com.pi.zanoraback.model.Property;
import com.pi.zanoraback.model.PropertyImage;
import com.pi.zanoraback.repository.jpa.PropertyImageRepository;
import com.pi.zanoraback.service.PropertyService;
import com.pi.zanoraback.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

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
    private final PropertyImageRepository propertyImageRepository;

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
    @GetMapping("/{propertyId}/images")
    public ResponseEntity<?> getImages(@PathVariable Long propertyId) {
        return ResponseEntity.ok(propertyService.getPropertyImagesMeta(propertyId));
    }

    /** GET /api/properties/{propertyId}/images/{imageId}/data  — raw bytes */
    @GetMapping("/{propertyId}/images/{imageId}/data")
    public ResponseEntity<byte[]> getImageData(
            @PathVariable Long propertyId,
            @PathVariable Long imageId) {
        // fetch via service or repo directly
        PropertyImage img = propertyImageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("Image not found"));
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(img.getContentType()))
                .body(img.getData());
    }

    /** POST /api/properties/{propertyId}/images  — upload */
    @PostMapping(value = "/{propertyId}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadImages(
            @PathVariable Long propertyId,
            @RequestParam(value = "files", required = false) List<MultipartFile> files,
            @RequestParam(value = "primaryIndex", required = false) Integer primaryIndex
    ) throws IOException {
        Long ownerId = userService.getCurrentlyAuthenticatedUser().getId();

        // Debug: log what arrived
        System.out.println(">>> files received: " + (files == null ? "NULL" : files.size()));
        System.out.println(">>> primaryIndex: " + primaryIndex);

        if (files == null || files.isEmpty()) {
            return ResponseEntity.badRequest().body("No files received");
        }

        return ResponseEntity.ok(propertyService.uploadPropertyImages(propertyId, ownerId, files, primaryIndex));
    }

    /** DELETE /api/properties/{propertyId}/images/{imageId} */
    @DeleteMapping("/{propertyId}/images/{imageId}")
    public ResponseEntity<Void> deleteImage(
            @PathVariable Long propertyId,
            @PathVariable Long imageId) {
        Long ownerId = userService.getCurrentlyAuthenticatedUser().getId();
        propertyService.deletePropertyImage(propertyId, imageId, ownerId);
        return ResponseEntity.noContent().build();
    }
}