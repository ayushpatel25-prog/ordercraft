package com.ordercraft.service.impl;

import com.ordercraft.dto.bom.BomExplosionItemDto;
import com.ordercraft.dto.order.SalesOrderItemRequest;
import com.ordercraft.dto.order.SalesOrderItemResponse;
import com.ordercraft.dto.order.SalesOrderRequest;
import com.ordercraft.dto.order.SalesOrderResponse;
import com.ordercraft.entity.*;
import com.ordercraft.exception.BusinessException;
import com.ordercraft.exception.ResourceNotFoundException;
import com.ordercraft.repository.*;
import com.ordercraft.service.AuditService;
import com.ordercraft.service.BomService;
import com.ordercraft.service.InventoryService;
import com.ordercraft.service.NotificationService;
import com.ordercraft.service.SalesOrderService;
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
import java.util.Optional;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SalesOrderServiceImpl implements SalesOrderService {

    private final SalesOrderRepository salesOrderRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final WorkOrderRepository workOrderRepository;
    private final InvoiceRepository invoiceRepository;
    private final InventoryRepository inventoryRepository;
    private final BomRepository bomRepository;
    private final BomService bomService;
    private final InventoryService inventoryService;
    private final AuditService auditService;
    private final NotificationService notificationService;

    @Override
    @Transactional(readOnly = true)
    public Page<SalesOrderResponse> getOrders(String query, Pageable pageable) {
        Page<SalesOrder> page = (query != null && !query.trim().isEmpty())
                ? salesOrderRepository.searchOrders(query.trim(), pageable)
                : salesOrderRepository.findAll(pageable);

        return page.map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SalesOrderResponse> getOrdersByStatus(SalesOrder.OrderStatus status) {
        return salesOrderRepository.findByStatus(status).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<SalesOrderResponse> getCustomerOrders(Long customerId) {
        return salesOrderRepository.findByCustomerId(customerId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public SalesOrderResponse getOrderById(Long id) {
        SalesOrder order = salesOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SalesOrder", "id", id));
        return toResponse(order);
    }

    @Override
    @Transactional
    public SalesOrderResponse createOrder(SalesOrderRequest request) {
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", request.getCustomerId()));

        String orderNumber = "SO-" + (1000 + new Random().nextInt(9000));
        while (salesOrderRepository.existsByOrderNumber(orderNumber)) {
            orderNumber = "SO-" + (1000 + new Random().nextInt(9000));
        }

        SalesOrder order = SalesOrder.builder()
                .orderNumber(orderNumber)
                .customer(customer)
                .orderDate(LocalDateTime.now())
                .expectedDeliveryDate(request.getExpectedDeliveryDate() != null ? request.getExpectedDeliveryDate() : LocalDate.now().plusDays(14))
                .status(SalesOrder.OrderStatus.DRAFT)
                .createdBy(getCurrentUsername())
                .build();

        for (SalesOrderItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", "id", itemReq.getProductId()));

            SalesOrderItem item = SalesOrderItem.builder()
                    .salesOrder(order)
                    .product(product)
                    .quantity(itemReq.getQuantity())
                    .unitPrice(itemReq.getUnitPrice())
                    .build();
            item.calculateTotal();
            order.addItem(item);
        }

        order.recalculateTotals();
        SalesOrder saved = salesOrderRepository.save(order);

        auditService.log("ORDER_CREATED", "SalesOrder", saved.getOrderNumber(), null,
                "Customer: " + customer.getName() + ", Amount: ₹" + saved.getTotalAmount());

        notificationService.createNotification(
                "New Sales Order Created: " + saved.getOrderNumber(),
                String.format("Sales order %s created for customer %s with total amount ₹%s.",
                        saved.getOrderNumber(), customer.getName(), saved.getTotalAmount()),
                Notification.NotificationType.INFO,
                "SALES"
        );

        return toResponse(saved);
    }

    @Override
    @Transactional
    public SalesOrderResponse confirmOrder(Long id) {
        SalesOrder order = salesOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SalesOrder", "id", id));

        if (order.getStatus() != SalesOrder.OrderStatus.DRAFT) {
            throw new BusinessException("Only DRAFT orders can be confirmed. Current status: " + order.getStatus());
        }

        order.setStatus(SalesOrder.OrderStatus.CONFIRMED);

        // Process BOM lookup and Work Order generation for ordered finished products
        for (SalesOrderItem item : order.getItems()) {
            Product prod = item.getProduct();

            // Check if active BOM exists for this product
            Optional<Bom> bomOpt = bomRepository.findByProductIdAndStatus(prod.getId(), "ACTIVE");
            if (bomOpt.isPresent()) {
                // Check material shortage vs availability
                List<BomExplosionItemDto> requirements = bomService.calculateRequirements(prod.getId(), item.getQuantity());
                boolean anyShortage = requirements.stream().anyMatch(r -> !r.getIsSufficient());

                // Auto-create Work Order for production shop floor
                String woNumber = "WO-" + (1000 + new Random().nextInt(9000));
                WorkOrder workOrder = WorkOrder.builder()
                        .workOrderNumber(woNumber)
                        .salesOrder(order)
                        .product(prod)
                        .quantity(item.getQuantity())
                        .startDate(LocalDate.now())
                        .expectedEndDate(order.getExpectedDeliveryDate())
                        .status(WorkOrder.WorkOrderStatus.PLANNED)
                        .assignedTo("Shop Floor Supervisor")
                        .progressPercentage(BigDecimal.ZERO)
                        .notes(anyShortage ? "Pending material procurement before assembly" : "Materials ready for production")
                        .build();
                workOrderRepository.save(workOrder);

                order.setStatus(SalesOrder.OrderStatus.IN_PROGRESS);

                if (anyShortage) {
                    notificationService.createNotification(
                            "Material Shortage Alert for " + order.getOrderNumber(),
                            "Order " + order.getOrderNumber() + " requires components that are below required quantities.",
                            Notification.NotificationType.WARNING,
                            "PROCUREMENT_OFFICER"
                    );
                }

                notificationService.createNotification(
                        "Work Order Generated: " + woNumber,
                        "Work Order " + woNumber + " planned for Sales Order " + order.getOrderNumber(),
                        Notification.NotificationType.SUCCESS,
                        "PRODUCTION_MANAGER"
                );
            } else {
                // If standard inventory item, check stock and reserve
                Optional<Inventory> inv = inventoryRepository.findByProductId(prod.getId());
                if (inv.isPresent() && inv.get().getAvailableQuantity().compareTo(item.getQuantity()) >= 0) {
                    inventoryService.reserveStock(prod.getId(), item.getQuantity(), "SALES_ORDER", order.getOrderNumber());
                }
            }
        }

        SalesOrder saved = salesOrderRepository.save(order);
        auditService.log("ORDER_CONFIRMED", "SalesOrder", saved.getOrderNumber(), "DRAFT", saved.getStatus().name());

        return toResponse(saved);
    }

    @Override
    @Transactional
    public SalesOrderResponse cancelOrder(Long id) {
        SalesOrder order = salesOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SalesOrder", "id", id));

        if (order.getStatus() == SalesOrder.OrderStatus.COMPLETED) {
            throw new BusinessException("Cannot cancel an order that has already been completed");
        }

        SalesOrder.OrderStatus oldStatus = order.getStatus();
        order.setStatus(SalesOrder.OrderStatus.CANCELLED);

        // Cancel associated work orders
        List<WorkOrder> workOrders = workOrderRepository.findBySalesOrderId(order.getId());
        for (WorkOrder wo : workOrders) {
            if (wo.getStatus() != WorkOrder.WorkOrderStatus.COMPLETED) {
                wo.setStatus(WorkOrder.WorkOrderStatus.CANCELLED);
                workOrderRepository.save(wo);
            }
        }

        // Release any reserved inventory
        for (SalesOrderItem item : order.getItems()) {
            Optional<Inventory> inv = inventoryRepository.findByProductId(item.getProduct().getId());
            if (inv.isPresent() && inv.get().getReservedQuantity().compareTo(BigDecimal.ZERO) > 0) {
                try {
                    inventoryService.releaseStock(item.getProduct().getId(), item.getQuantity(), "SALES_ORDER_CANCELLED", order.getOrderNumber());
                } catch (Exception e) {
                    // Ignore release if not reserved
                }
            }
        }

        SalesOrder saved = salesOrderRepository.save(order);
        auditService.log("ORDER_CANCELLED", "SalesOrder", saved.getOrderNumber(), oldStatus.name(), "CANCELLED");

        notificationService.createNotification(
                "Sales Order Cancelled: " + saved.getOrderNumber(),
                "Sales Order " + saved.getOrderNumber() + " has been cancelled.",
                Notification.NotificationType.ALERT,
                "SALES"
        );

        return toResponse(saved);
    }

    private SalesOrderResponse toResponse(SalesOrder order) {
        List<SalesOrderItemResponse> itemResponses = order.getItems().stream().map(item -> {
            BigDecimal stock = BigDecimal.ZERO;
            Optional<Inventory> inv = inventoryRepository.findByProductId(item.getProduct().getId());
            if (inv.isPresent()) {
                stock = inv.get().getAvailableQuantity();
            }
            boolean hasBom = bomRepository.findByProductIdAndStatus(item.getProduct().getId(), "ACTIVE").isPresent();

            return SalesOrderItemResponse.builder()
                    .id(item.getId())
                    .productId(item.getProduct().getId())
                    .productName(item.getProduct().getName())
                    .productSku(item.getProduct().getSku())
                    .unit(item.getProduct().getUnit())
                    .quantity(item.getQuantity())
                    .unitPrice(item.getUnitPrice())
                    .totalPrice(item.getTotalPrice())
                    .availableStock(stock)
                    .hasBom(hasBom)
                    .build();
        }).collect(Collectors.toList());

        Long woId = null;
        String woNumber = null;
        List<WorkOrder> workOrders = workOrderRepository.findBySalesOrderId(order.getId());
        if (!workOrders.isEmpty()) {
            WorkOrder firstWo = workOrders.get(0);
            woId = firstWo.getId();
            woNumber = firstWo.getWorkOrderNumber();
        }

        Long invoiceId = null;
        String invoiceNumber = null;
        Optional<Invoice> invoiceOpt = invoiceRepository.findBySalesOrderId(order.getId());
        if (invoiceOpt.isPresent()) {
            invoiceId = invoiceOpt.get().getId();
            invoiceNumber = invoiceOpt.get().getInvoiceNumber();
        }

        return SalesOrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .customerId(order.getCustomer().getId())
                .customerName(order.getCustomer().getName())
                .customerEmail(order.getCustomer().getEmail())
                .orderDate(order.getOrderDate())
                .expectedDeliveryDate(order.getExpectedDeliveryDate())
                .status(order.getStatus())
                .subtotal(order.getSubtotal())
                .taxAmount(order.getTaxAmount())
                .totalAmount(order.getTotalAmount())
                .createdBy(order.getCreatedBy())
                .items(itemResponses)
                .associatedWorkOrderId(woId)
                .associatedWorkOrderNumber(woNumber)
                .associatedInvoiceId(invoiceId)
                .associatedInvoiceNumber(invoiceNumber)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }

    private String getCurrentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (auth != null && auth.isAuthenticated()) ? auth.getName() : "Ayush Patel";
    }
}
