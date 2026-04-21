package com.pi.zanoraback.repository.jpa;

import com.pi.zanoraback.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {
    Optional<User> findUserByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByUsername(String EmployeeId);
    boolean existsByEmail(String email);
    long countByIsActive(boolean isActive);
    List<User> findByRoleNameAndIsActiveTrue(String roleName);
}