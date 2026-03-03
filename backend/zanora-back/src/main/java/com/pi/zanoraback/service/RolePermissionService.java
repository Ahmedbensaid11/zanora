package com.pi.zanoraback.service;


import com.pi.zanoraback.dto.PermissionDto;
import com.pi.zanoraback.dto.RoleDto;
import com.pi.zanoraback.exception.PermissionAssignedException;
import com.pi.zanoraback.exception.PermissionNotFoundException;
import com.pi.zanoraback.exception.RoleNotFoundException;
import com.pi.zanoraback.model.Permission;
import com.pi.zanoraback.model.Role;
import com.pi.zanoraback.repository.jpa.PermissionRepository;
import com.pi.zanoraback.repository.jpa.RoleRepository;
import com.pi.zanoraback.repository.jpa.UserRepository;
import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RolePermissionService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final UserRepository userRepository;

    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }

    public List<Permission> getAllPermissions() {
        return permissionRepository.findAll();
    }
    public Role updateRole(Long roleId, RoleDto updatedRole) {
        Role existingRole = roleRepository.findById(roleId)
                .orElseThrow(() -> new RoleNotFoundException("Role with ID " + roleId + " not found."));

        existingRole.setName(updatedRole.getName());
        existingRole.setColor(updatedRole.getColor());
        existingRole.setDescription(updatedRole.getDescription());
        existingRole.setActive(updatedRole.isActive());

        return roleRepository.save(existingRole);
    }

    public void  deleteRole (Long roleId){
        if (roleRepository.existsById(roleId)) {
            roleRepository.deleteById(roleId);
        }else{
            throw new RoleNotFoundException("Role with ID " + roleId + " not found.");
        }
    }

    public Role createRoleWithPermissions(RoleDto roleDTO) {
        Role role = new Role();
        role.setName(roleDTO.getName());
        role.setDescription(roleDTO.getDescription());
        role.setActive(roleDTO.isActive());
        role.setColor(roleDTO.getColor());

        Set<Long> permissionIds = Optional.ofNullable(roleDTO.getPermissions())
                .orElse(Collections.emptySet())
                .stream()
                .map(PermissionDto::getId)
                .collect(Collectors.toSet());

        Set<Permission> permissions = new HashSet<>(permissionRepository.findAllById(permissionIds));
        role.setPermissions(permissions);

        return roleRepository.save(role);
    }

    public Role updateRolePermissions(Long roleId, Set<Long> permissionIds) {
        Role role = roleRepository.findById(roleId).orElseThrow();
        Set<Permission> permissions = new HashSet<>(permissionRepository.findAllById(permissionIds));
        role.setPermissions(permissions);
        return roleRepository.save(role);
    }
    public Permission createPermission(PermissionDto permissionDto) {
        if (permissionRepository.existsByNameAndResourceAndAction(
                permissionDto.getName(),
                permissionDto.getResource(),
                permissionDto.getAction())) {
            throw new IllegalArgumentException("Permission with this name, resource, and action already exists");
        }

        Permission permission = new Permission();
        permission.setName(permissionDto.getName());
        permission.setDescription(permissionDto.getDescription());
        permission.setResource(permissionDto.getResource());
        permission.setAction(permissionDto.getAction());
        System.out.println("permissionDto.isActive() "+permissionDto.isActive());
        permission.setActive(permissionDto.isActive());

        return permissionRepository.save(permission);
    }

    public Permission getPermissionById(Long id) {
        return permissionRepository.findById(id)
                .orElseThrow(() -> new PermissionNotFoundException("Permission with ID " + id + " not found"));
    }

    public Permission updatePermission(Long id, PermissionDto permissionDto) {
        Permission existingPermission = getPermissionById(id);

        if (!existingPermission.getName().equals(permissionDto.getName()) ||
                !existingPermission.getResource().equals(permissionDto.getResource()) ||
                !existingPermission.getAction().equals(permissionDto.getAction())) {

            if (permissionRepository.existsByNameAndResourceAndActionAndIdNot(
                    permissionDto.getName(),
                    permissionDto.getResource(),
                    permissionDto.getAction(),
                    id)) {
                throw new IllegalArgumentException("Permission with this name, resource, and action already exists");
            }
        }

        existingPermission.setName(permissionDto.getName());
        existingPermission.setDescription(permissionDto.getDescription());
        existingPermission.setResource(permissionDto.getResource());
        existingPermission.setAction(permissionDto.getAction());
        existingPermission.setActive(permissionDto.isActive());

        return permissionRepository.save(existingPermission);
    }

    public void deletePermission(Long id) {
        Permission permission = getPermissionById(id);

        List<Role> rolesWithPermission = roleRepository.findByPermissionsId(id);
        if (!rolesWithPermission.isEmpty()) {
            throw new PermissionAssignedException("Cannot delete permission that is assigned to roles: " +
                    rolesWithPermission.stream()
                            .map(Role::getName)
                            .collect(Collectors.joining(", ")));
        }

        permissionRepository.deleteById(id);
    }

    public List<Permission> getPermissionsByResource(String resource) {
        return permissionRepository.findByResourceOrderByActionAsc(resource);
    }

    public List<String> getAllResources() {
        return permissionRepository.findDistinctResources();
    }
}
