package com.pi.zanoraback.repository.jpa;

import com.pi.zanoraback.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // All notifications for a user, newest first
    List<Notification> findByRecipientIdOrderByCreatedAtDesc(Long recipientId);

    // Only unread notifications for a user
    List<Notification> findByRecipientIdAndIsReadFalseOrderByCreatedAtDesc(Long recipientId);

    // Count of unread (for a badge in the UI)
    long countByRecipientIdAndIsReadFalse(Long recipientId);

    // Mark all of a user's notifications as read in one query
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.recipient.id = :recipientId AND n.isRead = false")
    void markAllAsReadForUser(@Param("recipientId") Long recipientId);
}