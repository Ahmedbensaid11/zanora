package com.pi.zanoraback.dto;

import com.pi.zanoraback.model.NotificationType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class NotificationResponseDTO {
    private Long id;
    private NotificationType type;
    private String message;
    private Long offerId;
    private Long propertyId;
    private String reviewId;
    private boolean isRead;
    private LocalDateTime createdAt;
}