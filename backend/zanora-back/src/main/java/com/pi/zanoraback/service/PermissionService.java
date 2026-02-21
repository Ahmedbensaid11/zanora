package com.pi.zanoraback.service;

import com.pi.zanoraback.model.User;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class PermissionService {
    final private UserService userService;

    public PermissionService(UserService userService) {
        this.userService = userService;
    }

    public boolean hasPermission(String resource, String action) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }

        User currentUser = getCurrentUser();
        if (currentUser == null || currentUser.getRole() == null) {
            return false;
        }

        return currentUser.getRole().getPermissions().stream()
                .anyMatch(permission ->
                        permission.getResource().equals(resource) &&
                                permission.getAction().equals(action) &&
                                permission.isActive()
                );
    }

    public boolean hasAnyPermission(String resource, String... actions) {
        for (String action : actions) {
            if (hasPermission(resource, action)) {
                return true;
            }
        }
        return false;
    }

    private User getCurrentUser() {
        return userService.getCurrentlyAuthenticatedUser();
    }
}
