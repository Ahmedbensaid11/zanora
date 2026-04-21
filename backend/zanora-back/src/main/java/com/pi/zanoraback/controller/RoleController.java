package com.pi.zanoraback.controller;

import com.pi.zanoraback.annotation.RequirePermission;
import com.pi.zanoraback.dto.PermissionDto;
import com.pi.zanoraback.dto.RoleDto;
import com.pi.zanoraback.model.Permission;
import com.pi.zanoraback.model.Role;
import com.pi.zanoraback.service.PermissionService;
import com.pi.zanoraback.service.RolePermissionService;
import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
public class RoleController {
    @Autowired
    private final RolePermissionService rolePermissionService;
    @Autowired
    private final PermissionService permissionService;
    @GetMapping("/check")
    public ResponseEntity<Boolean> checkPermission(@RequestParam String resource, @RequestParam String action) {

        boolean hasPerm = permissionService.hasPermission(resource, action);
        return ResponseEntity.ok(hasPerm);
    }

    @GetMapping("/all_roles")
    public ResponseEntity<List<Role>> getAllRoles() {
        return ResponseEntity.ok(rolePermissionService.getAllRoles());
    }

    @GetMapping("/permissions")
    public ResponseEntity<List<Permission>> getAllPermissions() {
        return ResponseEntity.ok(rolePermissionService.getAllPermissions());
    }

    @PostMapping("/roles")
    public ResponseEntity<Role> createRole(@RequestBody RoleDto roleDto) {
        Role createdRole = rolePermissionService.createRoleWithPermissions(roleDto);
        return ResponseEntity.ok(createdRole);
    }
    @PutMapping("/roles/{id}/permissions")
    public ResponseEntity<Role> updateRolePermissions(
            @PathVariable Long id,
            @RequestBody Set<Long> permissionIds
    ) {
        Role updatedRole = rolePermissionService.updateRolePermissions(id, permissionIds);
        return ResponseEntity.ok(updatedRole);
    }
    @PutMapping("/roles/{id}")
    public ResponseEntity<Role> updateRole(@PathVariable Long id, @RequestBody RoleDto roleDto) {
        Role updatedRole = rolePermissionService.updateRole(id, roleDto);
        return ResponseEntity.ok(updatedRole);
    }

    @DeleteMapping("/roles/{id}")
    public ResponseEntity<Void> deleteRole(@PathVariable Long id) {
        rolePermissionService.deleteRole(id);
        return ResponseEntity.noContent().build();
    }
    @RequirePermission(resource = "PERMISSION", action = "CREATE")
    @PostMapping("/permissions")
    public ResponseEntity<Permission> createPermission(@RequestBody PermissionDto permissionDto) {
        Permission createdPermission = rolePermissionService.createPermission(permissionDto);
        return ResponseEntity.ok(createdPermission);
    }

    @GetMapping("/permissions/{id}")
    public ResponseEntity<Permission> getPermissionById(@PathVariable Long id) {
        Permission permission = rolePermissionService.getPermissionById(id);
        return ResponseEntity.ok(permission);
    }

    @PutMapping("/permissions/{id}")
    public ResponseEntity<Permission> updatePermission(@PathVariable Long id, @RequestBody PermissionDto permissionDto) {
        Permission updatedPermission = rolePermissionService.updatePermission(id, permissionDto);
        return ResponseEntity.ok(updatedPermission);
    }
    @DeleteMapping("/permissions/{id}")
    public ResponseEntity<Void> deletePermission(@PathVariable Long id) {
        rolePermissionService.deletePermission(id);
        return ResponseEntity.noContent().build();
    }

    @RequirePermission(resource = "PERMISSION", action = "CREATE")
    @GetMapping("/Permission/create")
    public ResponseEntity<Void> canCreatePermission() {
        return ResponseEntity.ok().build();
    }
    @RequirePermission(resource = "PERMISSION", action = "READ")
    @GetMapping("/Permission/read")
    public ResponseEntity<Void> canReadPermission() {
        return ResponseEntity.ok().build();
    }


    @GetMapping("/Permission/update")
    public ResponseEntity<Void> canUpdatePermission() {
        return ResponseEntity.ok().build();
    }

    @GetMapping("/Permission/delete")
    public ResponseEntity<Void> canDeletePermission() {
        return ResponseEntity.ok().build();
    }
    @GetMapping("/role/create")
    public ResponseEntity<Void> canCreateRole() {
        return ResponseEntity.ok().build();
    }
    @GetMapping("/role/read")
    public ResponseEntity<Void> canReadRole() {
        return ResponseEntity.ok().build();
    }


    @GetMapping("/role/update")
    public ResponseEntity<Void> canUpdateRole() {
        return ResponseEntity.ok().build();
    }

    @GetMapping("/role/delete")
    public ResponseEntity<Void> canDeleteRole() {
        return ResponseEntity.ok().build();
    }


}
