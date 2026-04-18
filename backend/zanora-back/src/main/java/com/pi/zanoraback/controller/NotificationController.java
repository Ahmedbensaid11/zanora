package com.pi.zanoraback.controller;

import com.pi.zanoraback.dto.NotificationResponseDTO;
import com.pi.zanoraback.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    // ── REST endpoints (used on page load and for actions) ───────────────────

    /** GET /api/notifications — all notifications for the current user */
    @GetMapping
    public ResponseEntity<List<NotificationResponseDTO>> getAll() {
        return ResponseEntity.ok(notificationService.getMyNotifications());
    }

    /** GET /api/notifications/unread — only unread notifications */
    @GetMapping("/unread")
    public ResponseEntity<List<NotificationResponseDTO>> getUnread() {
        return ResponseEntity.ok(notificationService.getMyUnreadNotifications());
    }

    /** GET /api/notifications/unread/count — badge counter */
    @GetMapping("/unread/count")
    public ResponseEntity<Map<String, Long>> countUnread() {
        return ResponseEntity.ok(Map.of("count", notificationService.countUnread()));
    }

    /** PATCH /api/notifications/{id}/read — mark one as read */
    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.noContent().build();
    }

    /** PATCH /api/notifications/read-all — mark all as read */
    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead() {
        notificationService.markAllAsRead();
        return ResponseEntity.noContent().build();
    }

    // ── STOMP endpoint (optional — lets client ping the server over WS) ──────

    /**
     * Client sends to /app/notifications/ping
     * Server responds to /user/{id}/queue/notifications with fresh unread count.
     * Useful as a reconnect sync after the client comes back online.
     */
    @MessageMapping("/notifications/ping")
    public void ping(java.security.Principal principal) {
        // principal.getName() is the userId string set by WebSocketAuthInterceptor
        // No-op for now — the client just uses this to confirm the connection is alive
        // You could push a fresh unread count here if desired
    }
}