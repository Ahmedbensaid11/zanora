package com.pi.zanoraback.service;

import com.pi.zanoraback.dto.RoleDto;
import com.pi.zanoraback.model.Role;
import com.pi.zanoraback.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;

    public List<RoleDto> getAllRoles() {
        return roleRepository.findAll()
                .stream()
                .map(this::convertToDto)
                .toList();
    }

    public List<RoleDto> getActiveRoles() {
        return roleRepository.findByIsActiveTrue()
                .stream()
                .map(this::convertToDto)
                .toList();
    }

    public Optional<RoleDto> getRoleById(Long id) {
        return roleRepository.findById(id)
                .map(this::convertToDto);
    }

    public Optional<RoleDto> getRoleByName(String name) {
        return roleRepository.findByName(name)
                .map(this::convertToDto);
    }

    public RoleDto createRole(RoleDto roleDto) {
        if (roleRepository.existsByName(roleDto.getName())) {
            throw new RuntimeException("Role with name '" + roleDto.getName() + "' already exists");
        }

        Role role = Role.builder()
                .name(roleDto.getName())
                .description(roleDto.getDescription())
                .isActive(roleDto.isActive())
                .build();

        Role savedRole = roleRepository.save(role);
        return convertToDto(savedRole);
    }

    public RoleDto updateRole(Long id, RoleDto roleDto) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found with id: " + id));

        if (!role.getName().equals(roleDto.getName()) &&
                roleRepository.existsByName(roleDto.getName())) {
            throw new RuntimeException("Role with name '" + roleDto.getName() + "' already exists");
        }

        role.setName(roleDto.getName());
        role.setDescription(roleDto.getDescription());
        role.setActive(roleDto.isActive());

        Role updatedRole = roleRepository.save(role);
        return convertToDto(updatedRole);
    }

    public void deleteRole(Long id) {
        if (!roleRepository.existsById(id)) {
            throw new RuntimeException("Role not found with id: " + id);
        }
        roleRepository.deleteById(id);
    }

    private RoleDto convertToDto(Role role) {
        return RoleDto.builder()
                .id(role.getId())
                .name(role.getName())
                .description(role.getDescription())
                .color(role.getColor())
                .isActive(role.isActive())
                .build();
    }
    public Role findRoleEntityById(Long id) {
        return roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found with id: " + id));
    }

}