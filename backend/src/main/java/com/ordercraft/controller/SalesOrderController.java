package com.ordercraft.controller;

import com.ordercraft.dto.order.SalesOrderRequest;
import com.ordercraft.dto.order.SalesOrderResponse;
import com.ordercraft.entity.SalesOrder;
import com.ordercraft.service.SalesOrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "Sales Orders", description = "Customer sales order processing and order-to-cash workflow")
public class SalesOrderController {

    private final SalesOrderService salesOrderService;

    @Operation(summary = "Get paginated sales orders with optional search")
    @GetMapping
    public ResponseEntity<Page<SalesOrderResponse>> getOrders(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "orderDate") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        return ResponseEntity.ok(salesOrderService.getOrders(query, PageRequest.of(page, size, sort)));
    }

    @Operation(summary = "Get sales order by ID")
    @GetMapping("/{id}")
    public ResponseEntity<SalesOrderResponse> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(salesOrderService.getOrderById(id));
    }

    @Operation(summary = "Get orders for a specific customer")
    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<SalesOrderResponse>> getCustomerOrders(@PathVariable Long customerId) {
        return ResponseEntity.ok(salesOrderService.getCustomerOrders(customerId));
    }

    @Operation(summary = "Get orders filtered by status")
    @GetMapping("/status/{status}")
    public ResponseEntity<List<SalesOrderResponse>> getOrdersByStatus(@PathVariable SalesOrder.OrderStatus status) {
        return ResponseEntity.ok(salesOrderService.getOrdersByStatus(status));
    }

    @Operation(summary = "Create a new Sales Order (Draft)")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES')")
    @PostMapping
    public ResponseEntity<SalesOrderResponse> createOrder(@Valid @RequestBody SalesOrderRequest request) {
        return new ResponseEntity<>(salesOrderService.createOrder(request), HttpStatus.CREATED);
    }

    @Operation(summary = "Confirm Sales Order (triggers BOM check, shortage identification, and Work Order generation)")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES')")
    @PostMapping("/{id}/confirm")
    public ResponseEntity<SalesOrderResponse> confirmOrder(@PathVariable Long id) {
        return ResponseEntity.ok(salesOrderService.confirmOrder(id));
    }

    @Operation(summary = "Cancel Sales Order")
    @PreAuthorize("hasAnyRole('ADMIN', 'SALES')")
    @PostMapping("/{id}/cancel")
    public ResponseEntity<SalesOrderResponse> cancelOrder(@PathVariable Long id) {
        return ResponseEntity.ok(salesOrderService.cancelOrder(id));
    }
}
