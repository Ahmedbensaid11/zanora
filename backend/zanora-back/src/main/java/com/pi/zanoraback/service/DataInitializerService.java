package com.pi.zanoraback.service;
import com.pi.zanoraback.model.Permission;
import com.pi.zanoraback.model.Role;
import com.pi.zanoraback.model.User;
import com.pi.zanoraback.repository.PermissionRepository;
import com.pi.zanoraback.repository.RoleRepository;
import com.pi.zanoraback.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class DataInitializerService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:admin@example.com}")
    private String adminEmail;

    @Value("${app.admin.password:Admin@123}")
    private String adminPassword;

    @Value("${app.admin.username:admin}")
    private String adminUsername;

    @Value("${app.admin.firstName:Admin}")
    private String adminFirstName;

    @Value("${app.admin.lastName:User}")
    private String adminLastName;

    @PostConstruct
    @Transactional
    public void init() {
        initializeDefaultData();
    }

    private void initializeDefaultData() {
        long userCount = userRepository.count();

        if (userCount == 0) {
            log.info("=================================================");
            log.info("No users found. Initializing default data...");
            log.info("=================================================");

            try {
                Set<Permission> permissions = createDefaultPermissions();

                Role adminRole = createAdminRoleWithPermissions(permissions);

                createAdminUser(adminRole);

                log.info("=================================================");
                log.info("✓ Default Data Initialization Complete!");
                log.info("=================================================");

            } catch (Exception e) {
                log.error("Failed to initialize default data: {}", e.getMessage(), e);
                throw new RuntimeException("Failed to initialize application with default data", e);
            }
        } else {
            log.info("Application already has {} user(s). Skipping default data initialization.", userCount);
        }
    }

    private Set<Permission> createDefaultPermissions() {
        log.info("Creating default permissions...");

        List<PermissionData> defaultPermissions = List.of(
                new PermissionData("Create User", "Créer un utilisateur", "USER", "CREATE"),
                new PermissionData("Read User", "Voir les informations d'un utilisateur", "USER", "READ"),
                new PermissionData("Update User", "Modifier les informations d'un utilisateur", "USER", "UPDATE"),
                new PermissionData("Delete User", "Supprimer un utilisateur", "USER", "DELETE"),
                new PermissionData("Read Dashboard", "Voir le tableau de bord", "DASHBOARD", "READ"),
                new PermissionData("Create Role", "Créer un rôle", "ROLE", "CREATE"),
                new PermissionData("Read Role", "Voir les rôles", "ROLE", "READ"),
                new PermissionData("Update Role", "Modifier un rôle", "ROLE", "UPDATE"),
                new PermissionData("Delete Role", "Supprimer un rôle", "ROLE", "DELETE"),
                new PermissionData("Create Permission", "Créer une permission", "PERMISSION", "CREATE"),
                new PermissionData("Read Permission", "Voir les permissions", "PERMISSION", "READ"),
                new PermissionData("Update Permission", "Modifier une permission", "PERMISSION", "UPDATE"),
                new PermissionData("Delete Permission", "Supprimer une permission", "PERMISSION", "DELETE")
        );

        Set<Permission> createdPermissions = new HashSet<>();

        for (PermissionData permData : defaultPermissions) {
            // Check if permission already exists
            if (!permissionRepository.existsByNameAndResourceAndAction(
                    permData.name, permData.resource, permData.action)) {

                Permission permission = Permission.builder()
                        .name(permData.name)
                        .description(permData.description)
                        .resource(permData.resource)
                        .action(permData.action)
                        .isActive(true)
                        .build();

                Permission saved = permissionRepository.save(permission);
                createdPermissions.add(saved);
                log.info("✓ Created permission: {} - {} ({})",
                        saved.getResource(), saved.getAction(), saved.getName());
            } else {
                // If permission exists, retrieve it
                Permission existing = permissionRepository
                        .findByNameAndResourceAndAction(permData.name, permData.resource, permData.action)
                        .orElseThrow();
                createdPermissions.add(existing);
                log.info("  Permission already exists: {} - {}",
                        existing.getResource(), existing.getAction());
            }
        }

        log.info("✓ Total permissions created/retrieved: {}", createdPermissions.size());
        return createdPermissions;
    }

    private Role createAdminRoleWithPermissions(Set<Permission> permissions) {
        log.info("Creating Admin role with all permissions...");

        // Check if Admin role already exists
        return roleRepository.findByName("Admin")
                .map(existingRole -> {
                    log.info("  Admin role already exists with ID: {}", existingRole.getId());
                    // Update permissions if needed
                    existingRole.setPermissions(permissions);
                    existingRole.setActive(true);
                    return roleRepository.save(existingRole);
                })
                .orElseGet(() -> {
                    Role adminRole = Role.builder()
                            .name("Admin")
                            .description("System Administrator with full access to all features")
                            .isActive(true)
                            .color("Red")
                            .permissions(permissions)
                            .build();

                    Role savedRole = roleRepository.save(adminRole);
                    log.info("✓ Admin role created with ID: {} and {} permissions",
                            savedRole.getId(), savedRole.getPermissions().size());
                    return savedRole;
                });
    }

    private void createAdminUser(Role adminRole) {
        log.info("Creating default admin user...");

        // Check if admin user already exists by email
        if (userRepository.existsByEmail(adminEmail)) {
            log.warn("Admin user with email {} already exists. Skipping creation.", adminEmail);
            return;
        }

        // Check if admin user already exists by username
        if (userRepository.existsByUsername(adminUsername)) {
            log.warn("Admin user with username {} already exists. Skipping creation.", adminUsername);
            return;
        }

        // Create admin user
        User adminUser = User.builder()
                .username(adminUsername)
                .email(adminEmail)
                .password(passwordEncoder.encode(adminPassword))
                .role(adminRole)
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        userRepository.save(adminUser);

        log.info("=================================================");
        log.info("✓ Default Admin User Created Successfully!");
        log.info("=================================================");
        log.info("Login Credentials:");
        log.info("  Username:    {}", adminUsername);
        log.info("  Email:       {}", adminEmail);
        log.info("  Password:    {}", adminPassword);
        log.info("  Role:        {} (ID: {})", adminRole.getName(), adminRole.getId());
        log.info("  Permissions: {}", adminRole.getPermissions().size());
        log.info("=================================================");
        log.warn("⚠ SECURITY WARNING: Change the default password immediately after first login!");
        log.info("=================================================");
    }

    /**
     * Optional: Method to manually trigger initialization if needed
     */
    @Transactional
    public void initializeIfNeeded() {
        if (userRepository.count() == 0) {
            initializeDefaultData();
        }
    }

    /**
     * Helper class to hold permission data
     */
    private static class PermissionData {
        String name;
        String description;
        String resource;
        String action;

        PermissionData(String name, String description, String resource, String action) {
            this.name = name;
            this.description = description;
            this.resource = resource;
            this.action = action;
        }
    }
}