package com.ordercraft.repository;

import com.ordercraft.entity.BomItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BomItemRepository extends JpaRepository<BomItem, Long> {
    List<BomItem> findByBomId(Long bomId);
    List<BomItem> findByMaterialId(Long materialId);
}
