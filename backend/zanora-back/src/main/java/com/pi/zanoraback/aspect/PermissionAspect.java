package com.pi.zanoraback.aspect;

import com.pi.zanoraback.annotation.RequirePermission;
import com.pi.zanoraback.service.PermissionService;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class PermissionAspect {

    @Autowired
    private PermissionService permissionService;

    @Before("@annotation(requirePermission)")
    public void checkPermission(RequirePermission requirePermission) {
        if (!permissionService.hasPermission(requirePermission.resource(), requirePermission.action())) {
            throw new AccessDeniedException("Insufficient permissions");
        }
    }
}