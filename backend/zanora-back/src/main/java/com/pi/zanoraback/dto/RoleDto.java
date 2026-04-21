package com.pi.zanoraback.dto;

import com.pi.zanoraback.model.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoleDto {

    private Long id;
    private String name;
    private String description;
    private String color;
    private boolean isActive;
    private Set<PermissionDto> permissions;

    public static RoleDto convertRoleToDto(Role role) {
        if (role == null) {
            return null;
        }

        Set<PermissionDto> permissionDtos = role.getPermissions().stream()
                .map(PermissionDto::convertPermissionToDto)
                .collect(Collectors.toSet());

        return RoleDto.builder()
                .id(role.getId())
                .name(role.getName())
                .description(role.getDescription())
                .color(role.getColor())
                .isActive(role.isActive())
                .permissions(permissionDtos)
                .build();
    }

}
