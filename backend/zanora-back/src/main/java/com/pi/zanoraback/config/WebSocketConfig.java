package com.pi.zanoraback.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketAuthInterceptor webSocketAuthInterceptor;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Clients subscribe to destinations prefixed with /topic (broadcast)
        // or /user (user-specific queues)
        registry.enableSimpleBroker("/topic", "/queue");

        // Client sends messages to destinations prefixed with /app
        registry.setApplicationDestinationPrefixes("/app");

        // Prefix used for user-specific destinations: /user/{userId}/queue/...
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")  // tighten this in production
                .withSockJS();                  // SockJS fallback for older browsers
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // Attach JWT auth interceptor to every inbound STOMP frame
        registration.interceptors(webSocketAuthInterceptor);
    }
}