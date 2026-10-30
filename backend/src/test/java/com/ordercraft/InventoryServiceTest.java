package com.ordercraft;

import com.ordercraft.dto.inventory.InventoryAdjustmentRequest;
import com.ordercraft.dto.inventory.InventoryResponse;
import com.ordercraft.entity.Product;
import com.ordercraft.exception.BusinessException;
import com.ordercraft.repository.ProductRepository;
import com.ordercraft.service.InventoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
public class InventoryServiceTest {

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private ProductRepository productRepository;

    private Product testProduct;

    @BeforeEach
    void setUp() {
        testProduct = productRepository.findBySku("RM-STL-HSG").orElseThrow();
    }

    @Test
    @DisplayName("Should successfully adjust inventory upwards")
    void testPositiveInventoryAdjustment() {
        InventoryResponse initial = inventoryService.getInventoryByProductId(testProduct.getId());
        BigDecimal initialQty = initial.getQuantity();

        InventoryAdjustmentRequest req = InventoryAdjustmentRequest.builder()
                .productId(testProduct.getId())
                .quantity(BigDecimal.valueOf(10))
                .referenceType("MANUAL")
                .notes("Cycle count audit adjustment")
                .build();

        InventoryResponse adjusted = inventoryService.adjustStock(req);

        assertEquals(initialQty.add(BigDecimal.valueOf(10)).setScale(2), adjusted.getQuantity().setScale(2));
    }

    @Test
    @DisplayName("Should prevent adjusting stock below zero")
    void testNegativeInventoryPrevention() {
        InventoryResponse initial = inventoryService.getInventoryByProductId(testProduct.getId());

        InventoryAdjustmentRequest req = InventoryAdjustmentRequest.builder()
                .productId(testProduct.getId())
                .quantity(initial.getQuantity().add(BigDecimal.valueOf(100)).negate())
                .referenceType("MANUAL")
                .notes("Illegal negative adjustment")
                .build();

        assertThrows(BusinessException.class, () -> inventoryService.adjustStock(req));
    }

    @Test
    @DisplayName("Should reserve and release stock properly")
    void testReserveAndReleaseStock() {
        InventoryResponse initial = inventoryService.getInventoryByProductId(testProduct.getId());
        BigDecimal availableBefore = initial.getAvailableQuantity();

        inventoryService.reserveStock(testProduct.getId(), BigDecimal.valueOf(5), "TEST", "REF-1");
        InventoryResponse afterReserve = inventoryService.getInventoryByProductId(testProduct.getId());

        assertEquals(availableBefore.subtract(BigDecimal.valueOf(5)).setScale(2), afterReserve.getAvailableQuantity().setScale(2));

        inventoryService.releaseStock(testProduct.getId(), BigDecimal.valueOf(5), "TEST", "REF-1");
        InventoryResponse afterRelease = inventoryService.getInventoryByProductId(testProduct.getId());

        assertEquals(availableBefore.setScale(2), afterRelease.getAvailableQuantity().setScale(2));
    }
}
