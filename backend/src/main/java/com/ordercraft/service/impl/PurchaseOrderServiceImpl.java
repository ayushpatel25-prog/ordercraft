package com.ordercraft.service.impl;

import com.ordercraft.dto.procurement.PurchaseOrderItemRequest;
import com.ordercraft.dto.procurement.PurchaseOrderReceiveRequest;
import com.ordercraft.dto.procurement.PurchaseOrderRequest;
import com.ordercraft.dto.procurement.PurchaseOrderResponse;
import com.ordercraft.entity.Notification;
import com.ordercraft.entity.Product;
import com.ordercraft.entity.PurchaseOrder;
import com.ordercraft.entity.PurchaseOrderItem;
import com.ordercraft.entity.Supplier;
import com.ordercraft.exception.BusinessException;
import com.ordercraft.exception.ResourceNotFoundException;
import com.ordercraft.repository.ProductRepository;
import com.ordercraft.repository.PurchaseOrderItemRepository;
import com.ordercraft.repository.PurchaseOrderRepository;
import com.ordercraft.repository.SupplierRepository;
import com.ordercraft.service.AuditService;
import com.ordercraft.service.InventoryService;
import com.ordercraft.service.NotificationService;
import com.ordercraft.service.PurchaseOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PurchaseOrderServiceImpl implements PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final PurchaseOrderItemRepository purchaseOrderItemRepository;
    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;
    private final InventoryService inventoryService;
    private final AuditService auditService;
    private final NotificationService notificationService;

    @Override
    @Transactional(readOnly = true)
    public Page<PurchaseOrderResponse> getPurchaseOrders(String query, Pageable pageable) {
        Page<PurchaseOrder> page = (query != null && !query.trim().isEmpty())
                ? purchaseOrderRepository.searchPurchaseOrders(query.trim(), pageable)
                : purchaseOrderRepository.findAll(pageable);

        return page.map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PurchaseOrderResponse> getPurchaseOrdersByStatus(PurchaseOrder.POStatus status) {
        return purchaseOrderRepository.findByStatus(status).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PurchaseOrderResponse getPurchaseOrderById(Long id) {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PurchaseOrder", "id", id));
        return toResponse(po);
    }

    @Override
    @Transactional
    public PurchaseOrderResponse createPurchaseOrder(PurchaseOrderRequest request) {
        Supplier supplier = supplierRepository.findById(request.getSupplierId())
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", request.getSupplierId()));

        String poNumber = "PO-" + (1000 + new Random().nextInt(9000));
        PurchaseOrder po = PurchaseOrder.builder()
                .purchaseOrderNumber(poNumber)
                .supplier(supplier)
                .orderDate(LocalDateTime.now())
                .expectedDeliveryDate(request.getExpectedDeliveryDate() != null ? request.getExpectedDeliveryDate() : LocalDate.now().plusDays(7))
                .status(PurchaseOrder.POStatus.DRAFT)
                .createdBy(getCurrentUsername())
                .build();

        for (PurchaseOrderItemRequest itemReq : request.getItems()) {
            Product material = productRepository.findById(itemReq.getMaterialId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product/Material", "id", itemReq.getMaterialId()));

            PurchaseOrderItem item = PurchaseOrderItem.builder()
                    .purchaseOrder(po)
                    .material(material)
                    .quantity(itemReq.getQuantity())
                    .receivedQuantity(BigDecimal.ZERO)
                    .unitPrice(itemReq.getUnitPrice())
                    .build();
            item.calculateTotal();
            po.addItem(item);
        }

        po.recalculateTotal();
        PurchaseOrder saved = purchaseOrderRepository.save(po);

        auditService.log("PO_CREATED", "PurchaseOrder", saved.getPurchaseOrderNumber(), null,
                "Supplier: " + supplier.getName() + ", Amount: ₹" + saved.getTotalAmount());

        notificationService.createNotification(
                "Purchase Order Draft Created: " + saved.getPurchaseOrderNumber(),
                "PO created for supplier " + supplier.getName() + " totaling ₹" + saved.getTotalAmount(),
                Notification.NotificationType.INFO,
                "PROCUREMENT_OFFICER"
        );

        return toResponse(saved);
    }

    @Override
    @Transactional
    public PurchaseOrderResponse submitPurchaseOrder(Long id) {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PurchaseOrder", "id", id));

        if (po.getStatus() != PurchaseOrder.POStatus.DRAFT) {
            throw new BusinessException("Can only submit DRAFT purchase orders");
        }

        po.setStatus(PurchaseOrder.POStatus.SUBMITTED);
        PurchaseOrder saved = purchaseOrderRepository.save(po);
        auditService.log("PO_SUBMITTED", "PurchaseOrder", saved.getPurchaseOrderNumber(), "DRAFT", "SUBMITTED");

        notificationService.createNotification(
                "Purchase Order Awaiting Approval: " + saved.getPurchaseOrderNumber(),
                "PO " + saved.getPurchaseOrderNumber() + " submitted for management approval.",
                Notification.NotificationType.INFO,
                "ADMIN"
        );

        return toResponse(saved);
    }

    @Override
    @Transactional
    public PurchaseOrderResponse approvePurchaseOrder(Long id) {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PurchaseOrder", "id", id));

        if (po.getStatus() != PurchaseOrder.POStatus.SUBMITTED && po.getStatus() != PurchaseOrder.POStatus.DRAFT) {
            throw new BusinessException("Cannot approve purchase order in status: " + po.getStatus());
        }

        po.setStatus(PurchaseOrder.POStatus.APPROVED);
        po.setApprovedBy(getCurrentUsername());
        PurchaseOrder saved = purchaseOrderRepository.save(po);
        auditService.log("PO_APPROVED", "PurchaseOrder", saved.getPurchaseOrderNumber(), "SUBMITTED", "APPROVED");

        notificationService.createNotification(
                "Purchase Order Approved: " + saved.getPurchaseOrderNumber(),
                "PO approved and sent to supplier " + saved.getSupplier().getName(),
                Notification.NotificationType.SUCCESS,
                "PROCUREMENT_OFFICER"
        );

        return toResponse(saved);
    }

    @Override
    @Transactional
    public PurchaseOrderResponse receiveMaterials(Long id, PurchaseOrderReceiveRequest request) {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PurchaseOrder", "id", id));

        if (po.getStatus() == PurchaseOrder.POStatus.RECEIVED || po.getStatus() == PurchaseOrder.POStatus.CANCELLED) {
            throw new BusinessException("Cannot receive items for purchase order with status: " + po.getStatus());
        }

        Map<Long, PurchaseOrderItem> itemMap = po.getItems().stream()
                .collect(Collectors.toMap(PurchaseOrderItem::getId, item -> item));

        for (PurchaseOrderReceiveRequest.ItemReceiveDetail detail : request.getReceivedItems()) {
            PurchaseOrderItem item = itemMap.get(detail.getItemId());
            if (item == null) {
                throw new BusinessException("Item ID " + detail.getItemId() + " does not belong to Purchase Order " + po.getPurchaseOrderNumber());
            }

            BigDecimal newReceived = detail.getReceivedQuantity();
            if (newReceived.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            BigDecimal currentReceived = item.getReceivedQuantity();
            BigDecimal remainingExpected = item.getQuantity().subtract(currentReceived);

            if (newReceived.compareTo(remainingExpected) > 0) {
                throw new BusinessException(String.format("Received quantity (%s) cannot exceed remaining expected quantity (%s) for material %s",
                        newReceived, remainingExpected, item.getMaterial().getName()));
            }

            item.setReceivedQuantity(currentReceived.add(newReceived));

            // Atomically update inventory
            inventoryService.receiveStock(item.getMaterial().getId(), newReceived, "PURCHASE_ORDER", po.getPurchaseOrderNumber());
        }

        // Determine if completely received or partially received
        boolean allComplete = po.getItems().stream()
                .allMatch(i -> i.getReceivedQuantity().compareTo(i.getQuantity()) >= 0);

        if (allComplete) {
            po.setStatus(PurchaseOrder.POStatus.RECEIVED);
        } else {
            po.setStatus(PurchaseOrder.POStatus.PARTIALLY_RECEIVED);
        }

        PurchaseOrder saved = purchaseOrderRepository.save(po);
        auditService.log("PO_MATERIALS_RECEIVED", "PurchaseOrder", saved.getPurchaseOrderNumber(), null, "Status: " + saved.getStatus());

        notificationService.createNotification(
                "Materials Received for " + saved.getPurchaseOrderNumber(),
                "Inventory updated with incoming materials from supplier " + saved.getSupplier().getName(),
                Notification.NotificationType.SUCCESS,
                "PROCUREMENT_OFFICER"
        );

        return toResponse(saved);
    }

    @Override
    @Transactional
    public PurchaseOrderResponse cancelPurchaseOrder(Long id) {
        PurchaseOrder po = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PurchaseOrder", "id", id));

        if (po.getStatus() == PurchaseOrder.POStatus.RECEIVED) {
            throw new BusinessException("Cannot cancel an order that has already been fully received");
        }

        po.setStatus(PurchaseOrder.POStatus.CANCELLED);
        PurchaseOrder saved = purchaseOrderRepository.save(po);
        auditService.log("PO_CANCELLED", "PurchaseOrder", saved.getPurchaseOrderNumber(), null, "Status: CANCELLED");

        return toResponse(saved);
    }

    private PurchaseOrderResponse toResponse(PurchaseOrder po) {
        List<PurchaseOrderResponse.POItemResponse> items = po.getItems().stream().map(item ->
                PurchaseOrderResponse.POItemResponse.builder()
                        .id(item.getId())
                        .materialId(item.getMaterial().getId())
                        .materialName(item.getMaterial().getName())
                        .materialSku(item.getMaterial().getSku())
                        .unit(item.getMaterial().getUnit())
                        .quantity(item.getQuantity())
                        .receivedQuantity(item.getReceivedQuantity())
                        .unitPrice(item.getUnitPrice())
                        .totalPrice(item.getTotalPrice())
                        .build()
        ).collect(Collectors.toList());

        return PurchaseOrderResponse.builder()
                .id(po.getId())
                .purchaseOrderNumber(po.getPurchaseOrderNumber())
                .supplierId(po.getSupplier().getId())
                .supplierName(po.getSupplier().getName())
                .orderDate(po.getOrderDate())
                .expectedDeliveryDate(po.getExpectedDeliveryDate())
                .status(po.getStatus())
                .totalAmount(po.getTotalAmount())
                .createdBy(po.getCreatedBy())
                .approvedBy(po.getApprovedBy())
                .items(items)
                .createdAt(po.getCreatedAt())
                .updatedAt(po.getUpdatedAt())
                .build();
    }

    private String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (auth != null && auth.isAuthenticated()) ? auth.getName() : "Sunita Sharma";
    }
}
