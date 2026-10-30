package com.ordercraft.service;

import com.ordercraft.dto.procurement.PurchaseOrderReceiveRequest;
import com.ordercraft.dto.procurement.PurchaseOrderRequest;
import com.ordercraft.dto.procurement.PurchaseOrderResponse;
import com.ordercraft.entity.PurchaseOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface PurchaseOrderService {
    Page<PurchaseOrderResponse> getPurchaseOrders(String query, Pageable pageable);
    List<PurchaseOrderResponse> getPurchaseOrdersByStatus(PurchaseOrder.POStatus status);
    PurchaseOrderResponse getPurchaseOrderById(Long id);
    PurchaseOrderResponse createPurchaseOrder(PurchaseOrderRequest request);
    PurchaseOrderResponse submitPurchaseOrder(Long id);
    PurchaseOrderResponse approvePurchaseOrder(Long id);
    PurchaseOrderResponse receiveMaterials(Long id, PurchaseOrderReceiveRequest request);
    PurchaseOrderResponse cancelPurchaseOrder(Long id);
}
