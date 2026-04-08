package com.pi.zanoraback.repository.jpa;

import com.pi.zanoraback.model.City;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CityRepository extends JpaRepository<City, Long> {
    Optional<City> findByName(String name);
    @Query("""
        SELECT c FROM City c
        WHERE LOWER(c.name) LIKE LOWER(CONCAT('%', :query, '%'))
          AND (:stateId IS NULL OR c.state.id = :stateId)
        ORDER BY c.name ASC
        """)
    List<City> findSuggestions(@Param("query") String query,
                               @Param("stateId") Long stateId);
}
