package com.ordercraft.repository;

import com.ordercraft.entity.Bom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BomRepository extends JpaRepository<Bom, Long> {
    List<Bom> findByProductId(Long productId);
    Optional<Bom> findByProductIdAndStatus(Long productId, String status);
    Optional<Bom> findByProductIdAndVersion(Long productId, String version);
}
