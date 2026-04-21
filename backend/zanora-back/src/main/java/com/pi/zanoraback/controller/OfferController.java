package com.pi.zanoraback.controller;

import com.pi.zanoraback.dto.OfferRequestDTO;
import com.pi.zanoraback.dto.OfferRespondDTO;
import com.pi.zanoraback.dto.OfferResponseDTO;
import com.pi.zanoraback.service.OfferService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(
        origins = {"http://localhost:5173", "http://localhost:8081"},
        allowedHeaders = "*",
        methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PATCH,
                RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS},
        allowCredentials = "true"
)
@RestController
@RequestMapping("/api/offers")
@RequiredArgsConstructor
public class OfferController {

    private final OfferService offerService;

    // Buyer: submit an offer
    @PostMapping
    public ResponseEntity<OfferResponseDTO> createOffer(@Valid @RequestBody OfferRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(offerService.createOffer(dto));
    }

    // Owner: accept or decline an offer
    @PatchMapping("/{offerId}/respond")
    public ResponseEntity<OfferResponseDTO> respondToOffer(
            @PathVariable Long offerId,
            @Valid @RequestBody OfferRespondDTO dto) {
        return ResponseEntity.ok(offerService.respondToOffer(offerId, dto));
    }

    // Buyer: cancel a pending offer
    @DeleteMapping("/{offerId}")
    public ResponseEntity<Void> cancelOffer(@PathVariable Long offerId) {
        offerService.cancelOffer(offerId);
        return ResponseEntity.noContent().build();
    }

    // Owner: view all offers on a specific property
    @GetMapping("/property/{propertyId}")
    public ResponseEntity<List<OfferResponseDTO>> getOffersForProperty(@PathVariable Long propertyId) {
        return ResponseEntity.ok(offerService.getOffersForProperty(propertyId));
    }

    // Buyer: view all my submitted offers
    @GetMapping("/my")
    public ResponseEntity<Page<OfferResponseDTO>> getMyOffers(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(offerService.getMyOffers(pageable));
    }

    // Owner: view all incoming offers across all my properties
    @GetMapping("/incoming")
    public ResponseEntity<List<OfferResponseDTO>> getIncomingOffers() {
        return ResponseEntity.ok(offerService.getIncomingOffers());
    }
}