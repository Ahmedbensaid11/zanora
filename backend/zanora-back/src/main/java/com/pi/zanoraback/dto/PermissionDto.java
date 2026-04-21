package com.pi.zanoraback.dto;
import com.pi.zanoraback.model.Permission;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PermissionDto {
    @Getter
    private Long id;
    private String name;
    private String description;
    private String resource;
    private String action;
    private boolean isActive;

    public static PermissionDto convertPermissionToDto(Permission permission) {
        if (permission == null) {
            return null;
        }

        return PermissionDto.builder()
                .id(permission.getId())
                .name(permission.getName())
                .description(permission.getDescription())
                .resource(permission.getResource())
                .action(permission.getAction())
                .isActive(permission.isActive())
                .build();
    }
}