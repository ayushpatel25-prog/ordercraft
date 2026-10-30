package com.ordercraft.service;

import com.ordercraft.dto.workorder.ProgressUpdateRequest;
import com.ordercraft.dto.workorder.WorkOrderRequest;
import com.ordercraft.dto.workorder.WorkOrderResponse;
import com.ordercraft.entity.WorkOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface WorkOrderService {
    Page<WorkOrderResponse> getWorkOrders(String query, Pageable pageable);
    List<WorkOrderResponse> getWorkOrdersByStatus(WorkOrder.WorkOrderStatus status);
    WorkOrderResponse getWorkOrderById(Long id);
    WorkOrderResponse createWorkOrder(WorkOrderRequest request);
    WorkOrderResponse startWorkOrder(Long id);
    WorkOrderResponse pauseWorkOrder(Long id);
    WorkOrderResponse resumeWorkOrder(Long id);
    WorkOrderResponse updateProgress(Long id, ProgressUpdateRequest request);
    WorkOrderResponse consumeMaterials(Long id);
    WorkOrderResponse completeWorkOrder(Long id);
}
