package com.pi.zanoraback.repository.jpa;

import com.pi.zanoraback.model.State;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface StateRepository extends JpaRepository<State, Long> {
    @Query("SELECT s FROM State s WHERE LOWER(s.name) LIKE LOWER(CONCAT('%', :query, '%')) ORDER BY s.name ASC")
    List<State> findSuggestions(@Param("query") String query);
}
