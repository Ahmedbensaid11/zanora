package com.pi.zanoraback.controller;

import com.pi.zanoraback.dto.UpdatePasswordDto;
import com.pi.zanoraback.dto.UserDto;
import com.pi.zanoraback.exception.EmailAlreadyExistsException;
import com.pi.zanoraback.model.User;
import com.pi.zanoraback.repository.UserRepository;
import com.pi.zanoraback.security.UserDetailsImpl;
import com.pi.zanoraback.security.jwt.JwtService;
import com.pi.zanoraback.service.UserService;
import jakarta.validation.Valid;

import jakarta.validation.ValidationException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@CrossOrigin(
        origins = {"http://localhost:5173", "http://localhost:8081"},
        allowCredentials = "true"
)
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final JwtService jwtUtil;
    private final UserService userServiceImpl;
    private final UserRepository userRepository;
    private final UserDetailsImpl userDetailsImpl;
    public AuthController(AuthenticationManager authenticationManager,
                          UserService userService,
                          JwtService jwtUtil, UserService userServiceImpl, UserRepository userRepository, UserDetailsImpl userDetailsImpl) {
        this.authenticationManager = authenticationManager;
        this.userService = userService;
        this.jwtUtil = jwtUtil;
        this.userServiceImpl = userServiceImpl;
        this.userRepository = userRepository;
        this.userDetailsImpl = userDetailsImpl;
    }
    @GetMapping("/getallusers")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        List<UserDto> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody User user) {
        try {
            User createdUser = userService.createUser(user);
            UserDetails userDetails = userDetailsImpl.loadUserByUsername(createdUser.getEmail());
            String token = jwtUtil.generateToken(userDetails);
            System.out.println(user.toString());
            return ResponseEntity.ok(new AuthResponse(token));

        } catch (EmailAlreadyExistsException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }




    @PostMapping("/login")
    @Transactional

    public ResponseEntity<?> authenticateUser(@RequestBody AuthRequest authRequest) {
        User user = userRepository.findByEmail(authRequest.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if (!user.isActive()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Account suspended");
        }
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        authRequest.getEmail(),
                        authRequest.getPassword()
                )
        );

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String token = jwtUtil.generateToken(userDetails);
        return ResponseEntity.ok(new AuthResponse(token));
    }
    @GetMapping("/test")
    public String test() {
        return "OK";
    }

    @PreAuthorize("isAuthenticated()")
    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser() {

        UserDto user = userServiceImpl.getCurrentlyAuthenticatedUserDTO();


        return ResponseEntity.ok(user);
    }
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestBody @Valid UpdatePasswordDto updatePasswordDto
    ) {
        try {
            Long UserId = userService.getCurrentlyAuthenticatedUser().getId();
            userService.changePassword(UserId, updatePasswordDto);
            return ResponseEntity.ok("Password changed successfully");
        } catch (ValidationException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("An error occurred: " + e.getMessage());
        }
    }





    private static class AuthRequest {
        private String email;
        private String password;

        public String getEmail() {
            return email;
        }

        public String getPassword() {
            return password;
        }
    }

    private static class AuthResponse {
        private final String token;
        public AuthResponse(String token) { this.token = token; }
        public String getToken() { return token; }
    }
}
