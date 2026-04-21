package com.pi.zanoraback.repository;

import com.pi.zanoraback.model.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, Long> {
    List<Permission> findByResource(String resource);

    boolean existsByName(String name);

    Optional<Permission> findByName(String permissionName);
    boolean existsByNameAndResourceAndAction(String name, String resource, String action);

    boolean existsByNameAndResourceAndActionAndIdNot(String name, String resource, String action, Long id);

    List<Permission> findByResourceOrderByActionAsc(String resource);

    @Query("SELECT DISTINCT p.resource FROM Permission p ORDER BY p.resource")
    List<String> findDistinctResources();

    List<Permission> findByAction(String action);

    List<Permission> findByIsActiveTrue();
    Optional<Permission> findByNameAndResourceAndAction(String name, String resource, String action);
}