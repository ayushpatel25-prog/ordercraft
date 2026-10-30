package com.ordercraft.controller;

import com.ordercraft.dto.workorder.ProgressUpdateRequest;
import com.ordercraft.dto.workorder.WorkOrderRequest;
import com.ordercraft.dto.workorder.WorkOrderResponse;
import com.ordercraft.entity.WorkOrder;
import com.ordercraft.service.WorkOrderService;
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
@RequestMapping("/api/work-orders")
@RequiredArgsConstructor
@Tag(name = "Work Orders", description = "Shop floor production management and work order lifecycle")
public class WorkOrderController {

    private final WorkOrderService workOrderService;

    @Operation(summary = "Get paginated work orders with optional search")
    @GetMapping
    public ResponseEntity<Page<WorkOrderResponse>> getWorkOrders(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        return ResponseEntity.ok(workOrderService.getWorkOrders(query, PageRequest.of(page, size, sort)));
    }

    @Operation(summary = "Get work orders by status")
    @GetMapping("/status/{status}")
    public ResponseEntity<List<WorkOrderResponse>> getWorkOrdersByStatus(@PathVariable WorkOrder.WorkOrderStatus status) {
        return ResponseEntity.ok(workOrderService.getWorkOrdersByStatus(status));
    }

    @Operation(summary = "Get work order by ID")
    @GetMapping("/{id}")
    public ResponseEntity<WorkOrderResponse> getWorkOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(workOrderService.getWorkOrderById(id));
    }

    @Operation(summary = "Create work order manually")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCTION_MANAGER')")
    @PostMapping
    public ResponseEntity<WorkOrderResponse> createWorkOrder(@Valid @RequestBody WorkOrderRequest request) {
        return new ResponseEntity<>(workOrderService.createWorkOrder(request), HttpStatus.CREATED);
    }

    @Operation(summary = "Start production on work order")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCTION_MANAGER')")
    @PostMapping("/{id}/start")
    public ResponseEntity<WorkOrderResponse> startWorkOrder(@PathVariable Long id) {
        return ResponseEntity.ok(workOrderService.startWorkOrder(id));
    }

    @Operation(summary = "Pause work order (put ON_HOLD)")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCTION_MANAGER')")
    @PostMapping("/{id}/pause")
    public ResponseEntity<WorkOrderResponse> pauseWorkOrder(@PathVariable Long id) {
        return ResponseEntity.ok(workOrderService.pauseWorkOrder(id));
    }

    @Operation(summary = "Resume work order (put IN_PROGRESS)")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCTION_MANAGER')")
    @PostMapping("/{id}/resume")
    public ResponseEntity<WorkOrderResponse> resumeWorkOrder(@PathVariable Long id) {
        return ResponseEntity.ok(workOrderService.resumeWorkOrder(id));
    }

    @Operation(summary = "Update production progress percentage (0-100%)")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCTION_MANAGER')")
    @PostMapping("/{id}/progress")
    public ResponseEntity<WorkOrderResponse> updateProgress(
            @PathVariable Long id,
            @Valid @RequestBody ProgressUpdateRequest request) {
        return ResponseEntity.ok(workOrderService.updateProgress(id, request));
    }

    @Operation(summary = "Consume required BOM raw materials from inventory")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCTION_MANAGER')")
    @PostMapping("/{id}/consume-materials")
    public ResponseEntity<WorkOrderResponse> consumeMaterials(@PathVariable Long id) {
        return ResponseEntity.ok(workOrderService.consumeMaterials(id));
    }

    @Operation(summary = "Complete work order (adds finished good to stock and triggers invoicing)")
    @PreAuthorize("hasAnyRole('ADMIN', 'PRODUCTION_MANAGER')")
    @PostMapping("/{id}/complete")
    public ResponseEntity<WorkOrderResponse> completeWorkOrder(@PathVariable Long id) {
        return ResponseEntity.ok(workOrderService.completeWorkOrder(id));
    }
}
