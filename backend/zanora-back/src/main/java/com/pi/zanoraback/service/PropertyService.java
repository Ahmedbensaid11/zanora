package com.pi.zanoraback.service;


import com.pi.zanoraback.dto.CreatePropertyDTO;
import com.pi.zanoraback.model.*;
import com.pi.zanoraback.repository.jpa.PropertyRepository;
import com.pi.zanoraback.repository.jpa.RoleRepository;
import com.pi.zanoraback.repository.jpa.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PropertyService {

    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    @Transactional
    public Property createProperty(CreatePropertyDTO dto, Long ownerId) throws IOException {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if(owner.getRole().getName().equals("USER")){
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


        Property property = Property.builder()
                .title(dto.getTitle())
                .description(dto.getDescription())
                .type(dto.getType())
                .address(dto.getAddress())
                .city(dto.getCity())
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

        propertyRepository.delete(property);
    }

    @Transactional
    public Property updateProperty(Long propertyId, Long ownerId, CreatePropertyDTO dto) throws IOException {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));

        if (!property.getOwner().getId().equals(ownerId)) {
            throw new RuntimeException("Unauthorized: You do not own this property");
        }

        property.setTitle(dto.getTitle());
        property.setDescription(dto.getDescription());
        property.setType(dto.getType());
        property.setAddress(dto.getAddress());
        property.setCity(dto.getCity());
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
}
