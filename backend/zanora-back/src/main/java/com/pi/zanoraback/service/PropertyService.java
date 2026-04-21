package com.pi.zanoraback.service;

import com.pi.zanoraback.dto.CreatePropertyDTO;
import com.pi.zanoraback.dto.PropertyResponseDTO;
import com.pi.zanoraback.model.*;
import com.pi.zanoraback.repository.jpa.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PropertyService {

    private final PropertyRepository propertyRepository;
    private final OfferRepository offerRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PropertyImageRepository propertyImageRepository;

    private final CityRepository cityRepository;

    @Transactional
    public Property createProperty(CreatePropertyDTO dto, Long ownerId) throws IOException {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (owner.getRole().getName().equals("USER")) {
            Role role = roleRepository.findByName("LANDOWNER")
                    .map(existingRole -> {
                        existingRole.setActive(true);
                        return roleRepository.save(existingRole);
                    })
                    .orElseGet(() -> {
                        Role newRole = new Role();
                        newRole.setName("LANDOWNER");
                        newRole.setActive(true);
                        return roleRepository.save(newRole);
                    });
            owner.setRole(role);
        }

        City city = cityRepository.findById(dto.getCityId())
                .orElseThrow(() -> new RuntimeException("City not found"));

        Property property = Property.builder()
                .title(dto.getTitle())
                .description(dto.getDescription())
                .bathrooms(dto.getBathrooms())
                .bedrooms(dto.getBedrooms())
                .type(dto.getType())
                .address(dto.getAddress())
                .city(city)
                .averageRating(0.0f)
                .area(dto.getArea())
                .pricePerMonth(dto.getPricePerMonth())
                .status(PropertyStatus.AVAILABLE)
                .owner(owner)
                .build();

        List<PropertyImage> images = new ArrayList<>();
        List<MultipartFile> files = dto.getImages();

        for (int i = 0; i < files.size(); i++) {
            MultipartFile file = files.get(i);
            PropertyImage image = PropertyImage.builder()
                    .property(property)
                    .data(file.getBytes())
                    .contentType(file.getContentType())
                    .isPrimary(i == dto.getPrimaryImageIndex())
                    .build();
            images.add(image);
        }

        property.setImages(images);
        return propertyRepository.save(property);
    }

    @Transactional
    public void deleteProperty(Long propertyId, Long ownerId) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        if (!property.getOwner().getId().equals(ownerId)) {
            throw new RuntimeException("Unauthorized: You do not own this property");
        }

        // Clear child collections before deleting
        property.getImages().clear();
        List<Offer> offers = offerRepository.findByPropertyId(propertyId);
        offerRepository.deleteAll(offers);
        propertyRepository.save(property); // flush the orphan removal


        propertyRepository.delete(property);
    }

    @Transactional
    public Property updateProperty(Long propertyId, Long ownerId, CreatePropertyDTO dto) throws IOException {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        if (!property.getOwner().getId().equals(ownerId)) {
            throw new RuntimeException("Unauthorized: You do not own this property");
        }

        City city = cityRepository.findById(dto.getCityId())
                .orElseThrow(() -> new RuntimeException("City not found"));

        property.setTitle(dto.getTitle());
        property.setDescription(dto.getDescription());
        property.setBathrooms(dto.getBathrooms());
        property.setBedrooms(dto.getBedrooms());
        property.setType(dto.getType());
        property.setAddress(dto.getAddress());
        property.setCity(city);
        property.setArea(dto.getArea());
        property.setPricePerMonth(dto.getPricePerMonth());

        if (dto.getImages() != null && !dto.getImages().isEmpty()) {
            property.getImages().clear();

            List<PropertyImage> newImages = new ArrayList<>();
            List<MultipartFile> files = dto.getImages();

            for (int i = 0; i < files.size(); i++) {
                MultipartFile file = files.get(i);
                PropertyImage image = PropertyImage.builder()
                        .property(property)
                        .data(file.getBytes())
                        .contentType(file.getContentType())
                        .isPrimary(i == dto.getPrimaryImageIndex())
                        .build();
                newImages.add(image);
            }

            property.setImages(newImages);
        }

        return propertyRepository.save(property);
    }

    public boolean isOwner(Long propertyId, Long userId) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));
        return property.getOwner().getId().equals(userId);
    }
    // In PropertyService


    public List<Map<String, Object>> getPropertyImagesMeta(Long propertyId) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));
        return property.getImages().stream().map(img -> {
            Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("id", img.getId());
            m.put("isPrimary", img.isPrimary());
            m.put("contentType", img.getContentType());
            return m;
        }).toList();
    }

    @Transactional
    public void deletePropertyImage(Long propertyId, Long imageId, Long ownerId) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));
        if (!property.getOwner().getId().equals(ownerId))
            throw new RuntimeException("Unauthorized");
        PropertyImage image = property.getImages().stream()
                .filter(i -> i.getId().equals(imageId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Image not found"));
        property.getImages().remove(image);
        propertyRepository.save(property);
    }

    @Transactional
    public List<Map<String, Object>> uploadPropertyImages(Long propertyId, Long ownerId,
                                                          List<MultipartFile> files, Integer primaryIndex) throws IOException {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));
        if (!property.getOwner().getId().equals(ownerId))
            throw new RuntimeException("Unauthorized");
        for (int i = 0; i < files.size(); i++) {
            MultipartFile file = files.get(i);
            PropertyImage image = PropertyImage.builder()
                    .property(property)
                    .data(file.getBytes())
                    .contentType(file.getContentType())
                    .isPrimary(primaryIndex != null && i == primaryIndex)
                    .build();
            property.getImages().add(image);
        }
        propertyRepository.save(property);
        return getPropertyImagesMeta(propertyId);
    }

    // ─── NEW ──────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<PropertyResponseDTO> getMyProperties(Long ownerId, Pageable pageable) {
        return propertyRepository
                .findByOwnerId(ownerId, pageable) // ← no cast, just pass it directly
                .map(this::toResponseDTO);
    }

    private PropertyResponseDTO toResponseDTO(Property p) {
        List<String> imageUrls = new ArrayList<>();
        if (p.getImages() != null) {
            for (PropertyImage img : p.getImages()) {
                if (img.getData() != null) {
                    String base64 = Base64.getEncoder().encodeToString(img.getData());
                    imageUrls.add("data:" + img.getContentType() + ";base64," + base64);
                }
            }
        }

        return PropertyResponseDTO.builder()
                .id(p.getId())
                .title(p.getTitle())
                .description(p.getDescription())
                .bedrooms(p.getBedrooms())
                .bathrooms(p.getBathrooms())
                .type(p.getType())
                .address(p.getAddress())
                .cityName(p.getCity() != null ? p.getCity().getName() : null)
                .stateName(p.getCity() != null && p.getCity().getState() != null
                        ? p.getCity().getState().getName() : null)
                .area(p.getArea())
                .pricePerMonth(p.getPricePerMonth())
                .status(p.getStatus())
                .createdAt(p.getCreatedAt())
                .imageUrls(imageUrls)
                .averageRating(p.getAverageRating() != null
                        ? p.getAverageRating().doubleValue() : null)
                .build();
    }
}