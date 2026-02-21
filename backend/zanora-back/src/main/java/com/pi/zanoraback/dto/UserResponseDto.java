package com.pi.zanoraback.dto;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponseDto {
    private Long id;
    private String username;
    private String email;
    private RoleDto role;
    private byte[] profileImg;
    private boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}