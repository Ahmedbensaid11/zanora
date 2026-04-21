package com.pi.zanoraback.service;

import com.pi.zanoraback.dto.NotificationResponseDTO;
import com.pi.zanoraback.model.*;
import com.pi.zanoraback.repository.jpa.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserService userService;
    private final SimpMessagingTemplate messagingTemplate; // ← NEW

    // ── Internal helpers called by other services ────────────────────────────

    /**
     * Notify the property owner that a new offer has been received.
     */
    public void notifyOwnerOfNewOffer(Offer offer) {
        String msg = String.format(
                "%s made a %s offer of %.2f on your property \"%s\"",
                offer.getBuyer().getUsername(),
                offer.getType().name().toLowerCase(),
                offer.getProposedPrice(),
                offer.getProperty().getTitle()
        );

        save(Notification.builder()
                .recipient(offer.getProperty().getOwner())
                .type(NotificationType.OFFER_RECEIVED)
                .message(msg)
                .offerId(offer.getId())
                .propertyId(offer.getProperty().getId())
                .build());
    }

    /**
     * Notify the buyer that their offer was accepted or declined.
     */
    public void notifyBuyerOfOfferDecision(Offer offer) {
        boolean accepted = offer.getStatus() == OfferStatus.ACCEPTED;
        String msg = String.format(
                "Your offer on \"%s\" has been %s.%s",
                offer.getProperty().getTitle(),
                accepted ? "accepted 🎉" : "declined",
                offer.getOwnerNote() != null ? " Note: " + offer.getOwnerNote() : ""
        );

        NotificationType type = accepted
                ? NotificationType.OFFER_ACCEPTED
                : NotificationType.OFFER_DECLINED;

        save(Notification.builder()
                .recipient(offer.getBuyer())
                .type(type)
                .message(msg)
                .offerId(offer.getId())
                .propertyId(offer.getProperty().getId())
                .build());
    }

    /**
     * Notify the property owner that a new review has been posted.
     */
    public void notifyOwnerOfNewReview(String reviewerUsername,
                                       User propertyOwner,
                                       Long propertyId,
                                       String propertyTitle,
                                       String mongoReviewId) {
        String msg = String.format(
                "%s left a review on your property \"%s\"",
                reviewerUsername,
                propertyTitle
        );

        save(Notification.builder()
                .recipient(propertyOwner)
                .type(NotificationType.REVIEW_RECEIVED)
                .message(msg)
                .propertyId(propertyId)
                .reviewId(mongoReviewId)
                .build());
    }

    // ── API-facing methods (called via NotificationController) ───────────────

    @Transactional(readOnly = true)
    public List<NotificationResponseDTO> getMyNotifications() {
        Long userId = userService.getCurrentlyAuthenticatedUser().getId();
        return notificationRepository
                .findByRecipientIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<NotificationResponseDTO> getMyUnreadNotifications() {
        Long userId = userService.getCurrentlyAuthenticatedUser().getId();
        return notificationRepository
                .findByRecipientIdAndIsReadFalseOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long countUnread() {
        Long userId = userService.getCurrentlyAuthenticatedUser().getId();
        return notificationRepository.countByRecipientIdAndIsReadFalse(userId);
    }

    /** Mark a single notification as read (must belong to the current user). */
    public void markAsRead(Long notificationId) {
        Long userId = userService.getCurrentlyAuthenticatedUser().getId();
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException(
                        "Notification not found with id: " + notificationId));

        if (!n.getRecipient().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized: this notification does not belong to you");
        }

        n.setRead(true);
        notificationRepository.save(n);
    }

    /** Mark ALL notifications of the current user as read. */
    public void markAllAsRead() {
        Long userId = userService.getCurrentlyAuthenticatedUser().getId();
        notificationRepository.markAllAsReadForUser(userId);
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    /**
     * Persists the notification to the DB, then immediately pushes it
     * to the recipient's personal WebSocket queue if they are connected.
     * If they are offline, the push is silently dropped — they will see
     * the notification via the REST endpoint on their next login.
     */
    private void save(Notification notification) {
        Notification saved = notificationRepository.save(notification);
        NotificationResponseDTO dto = toDTO(saved);

        // convertAndSendToUser routes to /user/{recipientId}/queue/notifications
        // Spring matches this to whichever STOMP session has that principal name
        messagingTemplate.convertAndSendToUser(
                String.valueOf(notification.getRecipient().getId()),
                "/queue/notifications",
                dto
        );
    }

    private NotificationResponseDTO toDTO(Notification n) {
        return NotificationResponseDTO.builder()
                .id(n.getId())
                .type(n.getType())
                .message(n.getMessage())
                .offerId(n.getOfferId())
                .propertyId(n.getPropertyId())
                .reviewId(n.getReviewId())
                .isRead(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}