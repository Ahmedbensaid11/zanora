package com.pi.zanoraback.controller;

import com.pi.zanoraback.annotation.RequirePermission;
import com.pi.zanoraback.dto.RoleDto;
import com.pi.zanoraback.dto.UserDto;
import com.pi.zanoraback.dto.UserResponseDto;
import com.pi.zanoraback.model.Role;
import com.pi.zanoraback.model.User;
import com.pi.zanoraback.repository.UserRepository;
import com.pi.zanoraback.service.RolePermissionService;
import com.pi.zanoraback.service.UserService;
import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;
    private final RolePermissionService rolePermissionService;
    public UserController(UserService userService, UserRepository userRepository, RolePermissionService rolePermissionService) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.rolePermissionService = rolePermissionService;
    }
    @RequirePermission(resource = "USER", action = "CREATE")
    @PostMapping("/create-admin")
    public ResponseEntity<UserResponseDto> createAdminUser() {
        UserResponseDto adminUser = userService.createAdminUser();
        return ResponseEntity.ok(adminUser);
    }
    @GetMapping("/getallusers")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        List<UserDto> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }
    @RequirePermission(resource = "USER", action = "CREATE")
    @PostMapping("/create_user")
    public ResponseEntity<?> createUser(@Valid @RequestBody UserDto userDto) {
        try {
            User user = new User();
            user.setUsername(userDto.getUsername());
            user.setEmail(userDto.getEmail());
            user.setPassword(userDto.getPassword());
            user.setActive(userDto.isActive());
            user.setCity(userDto.getCity());
            if (userDto.getRole() != null && userDto.getRole().getId() != null) {
                List<Role> roles = rolePermissionService.getAllRoles();
                Role role = roles.stream()
                        .filter(r -> r.getId().equals(userDto.getRole().getId()))
                        .findFirst()
                        .orElseThrow(() -> new RuntimeException("Role not found"));
                user.setRole(role);
            }

            User createdUser = userService.createUser(user);
            UserResponseDto responseDto = userService.getUserById(createdUser.getId());

            return ResponseEntity.status(HttpStatus.CREATED).body(responseDto);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error creating user: " + e.getMessage());
        }
    }
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @Valid @RequestBody UserDto userDto) {
        try {
            UserResponseDto updatedUser = userService.updateUserById(id, userDto);
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error updating user: " + e.getMessage());
        }
    }
    @PutMapping("/{id}/activate")
    public ResponseEntity<String> activateUser(@PathVariable Long id) {
        try {
            userService.activateUserById(id);
            return ResponseEntity.ok("User activated successfully");
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
    @PutMapping("/{id}/deactivate")
    public ResponseEntity<String> deactivateUser(@PathVariable Long id) {
        try {
            userService.deactivateUserById(id);
            return ResponseEntity.ok("User deactivated successfully");
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
    @RequirePermission(resource = "USER", action = "DELETE")
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.ok("User deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/roles")
    public ResponseEntity<List<RoleDto>> getAvailableRoles() {
        List<Role> roles = rolePermissionService.getAllRoles();
        List<RoleDto> roleDtos = roles.stream()
                .filter(Role::isActive) // Only return active roles
                .map(RoleDto::convertRoleToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(roleDtos);
    }
    @PostMapping("/{id}/profile-picture")
    public ResponseEntity<?> uploadProfilePicture(@PathVariable Long id,
                                                  @RequestParam("file") MultipartFile file) {
        try {
            userService.updateProfilePicture(id, file);
            return ResponseEntity.ok(Map.of("message", "Profile picture updated successfully"));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Upload failed: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Error updating profile picture: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}/profile-picture")
    public ResponseEntity<byte[]> getProfilePicture(@PathVariable Long id) {
        try {
            byte[] image = userService.getProfilePicture(id);
            if (image == null || image.length == 0) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_JPEG)
                    .header("Cache-Control", "max-age=3600")
                    .body(image);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}/profile-picture")
    public ResponseEntity<?> deleteProfilePicture(@PathVariable Long id) {
        try {
            userService.deleteProfilePicture(id);
            return ResponseEntity.ok(Map.of("message", "Profile picture deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Error deleting profile picture: " + e.getMessage()));
        }
    }

}
