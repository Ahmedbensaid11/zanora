package com.pi.zanoraback.controller;
import com.pi.zanoraback.model.Role;
import com.pi.zanoraback.model.User;
import com.pi.zanoraback.repository.jpa.RoleRepository;
import com.pi.zanoraback.repository.jpa.UserRepository;
import com.pi.zanoraback.security.UserDetailsImpl;
import com.pi.zanoraback.security.jwt.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@CrossOrigin(
        origins = {"http://localhost:5173", "http://localhost:8081"},
        allowCredentials = "true"
)
@RestController
@RequestMapping("/api")
public class GoogleAuthController {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final JwtService jwtService;
    private final UserDetailsImpl userDetailsImpl;

    public GoogleAuthController(
            UserRepository userRepository,
            RoleRepository roleRepository,
            JwtService jwtService,
            UserDetailsImpl userDetailsImpl
    ) {
        this.userRepository  = userRepository;
        this.roleRepository  = roleRepository;
        this.jwtService      = jwtService;
        this.userDetailsImpl = userDetailsImpl;
    }


    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> body) {
        String email    = body.get("email");
        String name     = body.get("name");
        String googleId = body.get("googleId");

        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body("Missing email from Google");
        }
        if (googleId == null || googleId.isBlank()) {
            return ResponseEntity.badRequest().body("Missing googleId");
        }

        try {
            User user = userRepository.findByEmail(email).orElseGet(() -> {

                String baseUsername = (name != null && !name.isBlank())
                        ? name.replaceAll("\\s+", "_").toLowerCase()
                        : email.split("@")[0];

                String finalUsername = baseUsername;
                int suffix = 1;
                while (userRepository.existsByUsername(finalUsername)) {
                    finalUsername = baseUsername + suffix++;
                }

                Role defaultRole = roleRepository.findByName("USER")
                        .orElseThrow(() -> new RuntimeException(
                                "Default USER role not found. Please create it in the database."
                        ));

                User newUser = User.builder()
                        .email(email)
                        .username(finalUsername)
                        .password(UUID.randomUUID().toString())
                        .role(defaultRole)
                        .isActive(true)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build();

                return userRepository.save(newUser);
            });

            if (!user.isActive()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Account suspended");
            }

            UserDetails userDetails = userDetailsImpl.loadUserByUsername(user.getEmail());
            String token = jwtService.generateToken(userDetails);

            return ResponseEntity.ok(Map.of("token", token));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Google authentication error: " + e.getMessage());
        }
    }
}