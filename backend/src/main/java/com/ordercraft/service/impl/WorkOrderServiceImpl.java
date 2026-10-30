package com.ordercraft.service.impl;

import com.ordercraft.dto.bom.BomExplosionItemDto;
import com.ordercraft.dto.workorder.ProgressUpdateRequest;
import com.ordercraft.dto.workorder.WorkOrderRequest;
import com.ordercraft.dto.workorder.WorkOrderResponse;
import com.ordercraft.entity.*;
import com.ordercraft.exception.BusinessException;
import com.ordercraft.exception.ResourceNotFoundException;
import com.ordercraft.repository.*;
import com.ordercraft.service.AuditService;
import com.ordercraft.service.BomService;
import com.ordercraft.service.InventoryService;
import com.ordercraft.service.NotificationService;
import com.ordercraft.service.WorkOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkOrderServiceImpl implements WorkOrderService {

    private final WorkOrderRepository workOrderRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final ProductRepository productRepository;
    private final BomRepository bomRepository;
    private final BomService bomService;
    private final InventoryService inventoryService;
    private final AuditService auditService;
    private final NotificationService notificationService;

    @Override
    @Transactional(readOnly = true)
    public Page<WorkOrderResponse> getWorkOrders(String query, Pageable pageable) {
        Page<WorkOrder> page = (query != null && !query.trim().isEmpty())
                ? workOrderRepository.searchWorkOrders(query.trim(), pageable)
                : workOrderRepository.findAll(pageable);

        return page.map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkOrderResponse> getWorkOrdersByStatus(WorkOrder.WorkOrderStatus status) {
        return workOrderRepository.findByStatus(status).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public WorkOrderResponse getWorkOrderById(Long id) {
        WorkOrder wo = workOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("WorkOrder", "id", id));
        return toResponse(wo);
    }

    @Override
    @Transactional
    public WorkOrderResponse createWorkOrder(WorkOrderRequest request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", request.getProductId()));

        SalesOrder salesOrder = null;
        if (request.getSalesOrderId() != null) {
            salesOrder = salesOrderRepository.findById(request.getSalesOrderId()).orElse(null);
        }

        String woNumber = "WO-" + (1000 + new Random().nextInt(9000));
        WorkOrder wo = WorkOrder.builder()
                .workOrderNumber(woNumber)
                .salesOrder(salesOrder)
                .product(product)
                .quantity(request.getQuantity())
                .startDate(request.getStartDate() != null ? request.getStartDate() : LocalDate.now())
                .expectedEndDate(request.getExpectedEndDate() != null ? request.getExpectedEndDate() : LocalDate.now().plusDays(7))
                .status(WorkOrder.WorkOrderStatus.PLANNED)
                .assignedTo(request.getAssignedTo() != null ? request.getAssignedTo() : "Production Line 1")
                .progressPercentage(BigDecimal.ZERO)
                .notes(request.getNotes())
                .build();

        WorkOrder saved = workOrderRepository.save(wo);
        auditService.log("WORK_ORDER_CREATED", "WorkOrder", saved.getWorkOrderNumber(), null, "Created WO for " + product.getName());

        notificationService.createNotification(
                "Work Order Created: " + saved.getWorkOrderNumber(),
                "Planned production for " + saved.getQuantity() + " " + product.getUnit() + " of " + product.getName(),
                Notification.NotificationType.INFO,
                "PRODUCTION_MANAGER"
        );

        return toResponse(saved);
    }

    @Override
    @Transactional
    public WorkOrderResponse startWorkOrder(Long id) {
        WorkOrder wo = workOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("WorkOrder", "id", id));

        if (wo.getStatus() == WorkOrder.WorkOrderStatus.CANCELLED || wo.getStatus() == WorkOrder.WorkOrderStatus.COMPLETED) {
            throw new BusinessException("Cannot start work order in status: " + wo.getStatus());
        }

        WorkOrder.WorkOrderStatus oldStatus = wo.getStatus();
        wo.setStatus(WorkOrder.WorkOrderStatus.IN_PROGRESS);
        if (wo.getStartDate() == null) {
            wo.setStartDate(LocalDate.now());
        }

        WorkOrder saved = workOrderRepository.save(wo);
        auditService.log("WORK_ORDER_STARTED", "WorkOrder", saved.getWorkOrderNumber(), oldStatus.name(), "IN_PROGRESS");

        notificationService.createNotification(
                "Work Order Started: " + saved.getWorkOrderNumber(),
                "Assembly started for " + saved.getProduct().getName(),
                Notification.NotificationType.INFO,
                "PRODUCTION_MANAGER"
        );

        return toResponse(saved);
    }

    @Override
    @Transactional
    public WorkOrderResponse pauseWorkOrder(Long id) {
        WorkOrder wo = workOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("WorkOrder", "id", id));

        if (wo.getStatus() != WorkOrder.WorkOrderStatus.IN_PROGRESS) {
            throw new BusinessException("Can only pause an IN_PROGRESS work order");
        }

        wo.setStatus(WorkOrder.WorkOrderStatus.ON_HOLD);
        WorkOrder saved = workOrderRepository.save(wo);
        auditService.log("WORK_ORDER_PAUSED", "WorkOrder", saved.getWorkOrderNumber(), "IN_PROGRESS", "ON_HOLD");

        return toResponse(saved);
    }

    @Override
    @Transactional
    public WorkOrderResponse resumeWorkOrder(Long id) {
        WorkOrder wo = workOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("WorkOrder", "id", id));

        if (wo.getStatus() != WorkOrder.WorkOrderStatus.ON_HOLD) {
            throw new BusinessException("Can only resume an ON_HOLD work order");
        }

        wo.setStatus(WorkOrder.WorkOrderStatus.IN_PROGRESS);
        WorkOrder saved = workOrderRepository.save(wo);
        auditService.log("WORK_ORDER_RESUMED", "WorkOrder", saved.getWorkOrderNumber(), "ON_HOLD", "IN_PROGRESS");

        return toResponse(saved);
    }

    @Override
    @Transactional
    public WorkOrderResponse updateProgress(Long id, ProgressUpdateRequest request) {
        WorkOrder wo = workOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("WorkOrder", "id", id));

        if (wo.getStatus() == WorkOrder.WorkOrderStatus.COMPLETED || wo.getStatus() == WorkOrder.WorkOrderStatus.CANCELLED) {
            throw new BusinessException("Cannot update progress on " + wo.getStatus() + " work order");
        }

        BigDecimal oldProgress = wo.getProgressPercentage();
        wo.setProgressPercentage(request.getProgressPercentage());
        if (request.getNotes() != null && !request.getNotes().trim().isEmpty()) {
            wo.setNotes(request.getNotes());
        }

        if (request.getProgressPercentage().compareTo(BigDecimal.valueOf(100)) >= 0) {
            return completeWorkOrder(id);
        }

        WorkOrder saved = workOrderRepository.save(wo);
        auditService.log("PROGRESS_UPDATED", "WorkOrder", saved.getWorkOrderNumber(), oldProgress + "%", saved.getProgressPercentage() + "%");

        return toResponse(saved);
    }

    @Override
    @Transactional
    public WorkOrderResponse consumeMaterials(Long id) {
        WorkOrder wo = workOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("WorkOrder", "id", id));

        Optional<Bom> bomOpt = bomRepository.findByProductIdAndStatus(wo.getProduct().getId(), "ACTIVE");
        if (bomOpt.isEmpty()) {
            throw new BusinessException("No active BOM found for product: " + wo.getProduct().getName());
        }

        Bom bom = bomOpt.get();
        for (BomItem item : bom.getItems()) {
            BigDecimal required = item.getQuantityRequired().multiply(wo.getQuantity());
            inventoryService.consumeStock(item.getMaterial().getId(), required, "WORK_ORDER", wo.getWorkOrderNumber());
        }

        auditService.log("MATERIALS_CONSUMED_FOR_WO", "WorkOrder", wo.getWorkOrderNumber(), null, "Consumed materials per BOM v" + bom.getVersion());

        notificationService.createNotification(
                "Materials Consumed for " + wo.getWorkOrderNumber(),
                "Raw materials deducted from warehouse for production of " + wo.getProduct().getName(),
                Notification.NotificationType.INFO,
                "PRODUCTION_MANAGER"
        );

        return toResponse(wo);
    }

    @Override
    @Transactional
    public WorkOrderResponse completeWorkOrder(Long id) {
        WorkOrder wo = workOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("WorkOrder", "id", id));

        if (wo.getStatus() == WorkOrder.WorkOrderStatus.COMPLETED) {
            return toResponse(wo);
        }

        wo.setStatus(WorkOrder.WorkOrderStatus.COMPLETED);
        wo.setProgressPercentage(BigDecimal.valueOf(100));
        wo.setActualEndDate(LocalDate.now());

        // Increment finished good stock in inventory
        inventoryService.receiveStock(wo.getProduct().getId(), wo.getQuantity(), "PRODUCTION_COMPLETION", wo.getWorkOrderNumber());

        // Update Sales Order status if associated
        if (wo.getSalesOrder() != null) {
            SalesOrder so = wo.getSalesOrder();
            so.setStatus(SalesOrder.OrderStatus.COMPLETED);
            salesOrderRepository.save(so);

            notificationService.createNotification(
                    "Sales Order Completed: " + so.getOrderNumber(),
                    "Production finished for order " + so.getOrderNumber() + ". Ready for invoicing.",
                    Notification.NotificationType.SUCCESS,
                    "FINANCE_OFFICER"
            );
        }

        WorkOrder saved = workOrderRepository.save(wo);
        auditService.log("WORK_ORDER_COMPLETED", "WorkOrder", saved.getWorkOrderNumber(), null, "Finished good stock increased: " + saved.getQuantity());

        notificationService.createNotification(
                "Work Order Completed: " + saved.getWorkOrderNumber(),
                "Manufactured " + saved.getQuantity() + " units of " + saved.getProduct().getName(),
                Notification.NotificationType.SUCCESS,
                "PRODUCTION_MANAGER"
        );

        return toResponse(saved);
    }

    private WorkOrderResponse toResponse(WorkOrder wo) {
        List<BomExplosionItemDto> requiredMaterials = Collections.emptyList();
        try {
            requiredMaterials = bomService.calculateRequirements(wo.getProduct().getId(), wo.getQuantity());
        } catch (Exception e) {
            // No BOM attached or optional
        }

        return WorkOrderResponse.builder()
                .id(wo.getId())
                .workOrderNumber(wo.getWorkOrderNumber())
                .salesOrderId(wo.getSalesOrder() != null ? wo.getSalesOrder().getId() : null)
                .salesOrderNumber(wo.getSalesOrder() != null ? wo.getSalesOrder().getOrderNumber() : null)
                .customerName(wo.getSalesOrder() != null ? wo.getSalesOrder().getCustomer().getName() : null)
                .productId(wo.getProduct().getId())
                .productName(wo.getProduct().getName())
                .productSku(wo.getProduct().getSku())
                .quantity(wo.getQuantity())
                .startDate(wo.getStartDate())
                .expectedEndDate(wo.getExpectedEndDate())
                .actualEndDate(wo.getActualEndDate())
                .status(wo.getStatus())
                .assignedTo(wo.getAssignedTo())
                .progressPercentage(wo.getProgressPercentage())
                .notes(wo.getNotes())
                .requiredMaterials(requiredMaterials)
                .createdAt(wo.getCreatedAt())
                .updatedAt(wo.getUpdatedAt())
                .build();
    }
}
