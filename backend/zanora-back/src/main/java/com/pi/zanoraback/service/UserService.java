package com.pi.zanoraback.service;

import com.pi.zanoraback.dto.RoleDto;
import com.pi.zanoraback.dto.UpdatePasswordDto;
import com.pi.zanoraback.dto.UserDto;
import com.pi.zanoraback.dto.UserResponseDto;
import com.pi.zanoraback.exception.EmailAlreadyExistsException;
import com.pi.zanoraback.exception.UserNotFoundException;
import com.pi.zanoraback.model.Role;
import com.pi.zanoraback.model.User;
import com.pi.zanoraback.repository.RoleRepository;
import com.pi.zanoraback.repository.UserRepository;
import jakarta.validation.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.security.crypto.password.PasswordEncoder;
@Service
@RequiredArgsConstructor
@Transactional
public class UserService {
    @Autowired
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RoleService roleService;
    private final PasswordEncoder passwordEncoder;
    public List<UserDto> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }


    public User createUser(User user) throws EmailAlreadyExistsException {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new EmailAlreadyExistsException("Email " + user.getEmail() + " already exists");
        }
        if(user.getRole()==null){
            Optional<Role> r =roleRepository.findByName("USER");
            if(r.isPresent()){
                Role role = r.get();
                user.setRole(role);
            }

        }



        user.setPassword(passwordEncoder.encode(user.getPassword()));


        return userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public UserResponseDto getUserById(Long id) {

        User user = findUserById(id);
        return mapToResponseDto(user);
    }

    @Transactional(readOnly = true)
    public Page<UserResponseDto> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable)
                .map(this::mapToResponseDto);
    }

    public UserResponseDto updateUser(String username, UserDto userDto) {
        User user = findUserByEmployeeId(username);
        return updateUserEntity(user, userDto);
    }

    public UserResponseDto updateUserById(Long id, UserDto userDto) {
        User user = findUserById(id);
        return updateUserEntity(user, userDto);
    }

    private UserResponseDto updateUserEntity(User user, UserDto userDto) {
        validateUserUpdate(user, userDto);

        user.setEmail(userDto.getEmail());

        if (userDto.getPassword() != null && !userDto.getPassword().trim().isEmpty()) {
            user.setPassword(passwordEncoder.encode(userDto.getPassword()));
        }

        if (userDto.getRole() != null && userDto.getRole().getId() != null) {
            Role role = roleService.findRoleEntityById(userDto.getRole().getId());
            user.setRole(role);
        } else if (userDto.getRole() != null && userDto.getRole().getName() != null &&
                !userDto.getRole().getName().trim().isEmpty()) {
            Role role = roleRepository.findByName(userDto.getRole().getName())
                    .orElseThrow(() -> new RuntimeException("Role not found: " + userDto.getRole().getName()));
            user.setRole(role);
        }

        user.setActive(userDto.isActive());

        User savedUser = userRepository.save(user);
        return mapToResponseDto(savedUser);
    }


    public void changePassword(Long userId, UpdatePasswordDto updatePasswordDto) {
        validatePasswordChange(updatePasswordDto);

        User user = findUserById(userId);

        if (!passwordEncoder.matches(updatePasswordDto.getCurrentPassword(), user.getPassword())) {
            throw new ValidationException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(updatePasswordDto.getNewPassword()));
        userRepository.save(user);
    }

    public void activateUser(String EmployeeId) {
        User user = findUserByEmployeeId(EmployeeId);
        user.setActive(true);
        userRepository.save(user);
    }

    public void deactivateUser(String username) {
        User user = findUserByEmployeeId(username);
        user.setActive(false);
        userRepository.save(user);
    }
    public void activateUserById(Long id) {
        User user = findUserById(id);
        user.setActive(true);
        userRepository.save(user);
    }

    public void deactivateUserById(Long id) {
        User user = findUserById(id);
        user.setActive(false);
        userRepository.save(user);
    }

    public void deleteUser(Long id) {
        User user = findUserById(id);
        userRepository.delete(user);
    }

    @Transactional(readOnly = true)
    public Page<UserResponseDto> searchUsers(String username, String email, String role, Boolean isActive, Pageable pageable) {
        Specification<User> spec = buildUserSearchSpecification(username, email, role, isActive);
        return userRepository.findAll(spec, pageable)
                .map(this::mapToResponseDto);
    }

    @Transactional(readOnly = true)
    public long getUserCount() {
        return userRepository.count();
    }

    @Transactional(readOnly = true)
    public long getActiveUserCount() {
        return userRepository.countByIsActive(true);
    }

    private User findUserByEmployeeId(String username) {
        return userRepository.findUserByUsername(username)
                .orElseThrow(() -> new UserNotFoundException("User not found with username: " + username));
    }


    User findUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found with id: " + id));
    }
    @Transactional(readOnly = true)
    public UserDto getCurrentlyAuthenticatedUserDTO() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AuthenticationCredentialsNotFoundException("No authentication found");
        }

        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        return mapToDTO(user);
    }
    @Transactional(readOnly = true)
    public User getCurrentlyAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AuthenticationCredentialsNotFoundException("No authentication found");
        }

        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        return user;
    }

    private void validateUserUpdate(User existingUser, UserDto userDto) {
        if (!existingUser.getUsername().equals(userDto.getUsername()) &&
                userRepository.existsByUsername(userDto.getUsername())) {
            throw new ValidationException("Employee is already exists: " + userDto.getUsername());
        }

        if (!existingUser.getEmail().equals(userDto.getEmail()) &&
                userRepository.existsByEmail(userDto.getEmail())) {
            throw new ValidationException("Email already exists: " + userDto.getEmail());
        }
    }

    private void validatePasswordChange(UpdatePasswordDto updatePasswordDto) {
        if (!updatePasswordDto.isPasswordsMatch()) {
            throw new ValidationException("New password and confirmation password do not match");
        }
    }

    private Specification<User> buildUserSearchSpecification(String username, String email, String role, Boolean isActive) {
        Specification<User> spec = null;

        if (username != null && !username.trim().isEmpty()) {
            spec = spec.and((root, query, criteriaBuilder) ->
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("username")),
                            "%" + username.toLowerCase().trim() + "%"));
        }

        if (email != null && !email.trim().isEmpty()) {
            spec = spec.and((root, query, criteriaBuilder) ->
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("email")),
                            "%" + email.toLowerCase().trim() + "%"));
        }

        if (role != null && !role.trim().isEmpty()) {
            spec = spec.and((root, query, criteriaBuilder) ->
                    criteriaBuilder.equal(criteriaBuilder.lower(root.get("role")),
                            role.toLowerCase().trim()));
        }

        if (isActive != null) {
            spec = spec.and((root, query, criteriaBuilder) ->
                    criteriaBuilder.equal(root.get("isActive"), isActive));
        }

        return spec;
    }


    private UserResponseDto mapToResponseDto(User user) {
        return UserResponseDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(mapRoleToDto(user.getRole()))
                .isActive(user.isActive())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .profileImg(user.getProfileImg())
                .build();
    }


    private RoleDto mapRoleToDto(Role role) {
        if (role == null) return null;

        return RoleDto.builder()
                .id(role.getId())
                .name(role.getName())
                .description(role.getDescription())
                .isActive(role.isActive())
                .color(role.getColor())
                .build();
    }
    @Transactional
    public void updateProfilePicture(Long userId, MultipartFile file) throws IOException {
        User user = findUserById(userId);

        if (file != null && !file.isEmpty()) {
            user.setProfileImg(file.getBytes());
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
        } else {
            throw new IllegalArgumentException("File is empty or null");
        }
    }
    @Transactional
    public void deleteProfilePicture(Long userId) {
        User user = findUserById(userId);

        user.setProfileImg(null);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }
    @Transactional(readOnly = true)
    public byte[] getProfilePicture(Long userId) {
        User user = findUserById(userId);
        return user.getProfileImg();
    }



    private UserDto mapToDTO(User user){
        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .city(user.getCity())
                .role(mapRoleToDto(user.getRole()))
                .createdAt(user.getCreatedAt())
                .isActive(user.isActive())
                .profileImg(user.getProfileImg())
                .build();
    }


    public UserResponseDto createAdminUser() {
        String firstName = "Admin";
        String lastName = "User";
        String employeeId = "admin001";
        String email = "admin@example.com";
        String rawPassword = "Admin@123";

        if (userRepository.existsByEmail(email)) {
            throw new EmailAlreadyExistsException("Email " + email + " already exists");
        }

        if (userRepository.existsByUsername(employeeId)) {
            throw new ValidationException("Employee ID already exists: " + employeeId);
        }

        Role adminRole = roleService.findRoleEntityById(7L);

        User adminUser = User.builder()
                .username(employeeId)
                .email(email)
                .password(passwordEncoder.encode(rawPassword))
                .role(adminRole)
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        User savedUser = userRepository.save(adminUser);
        return mapToResponseDto(savedUser);
    }

}
