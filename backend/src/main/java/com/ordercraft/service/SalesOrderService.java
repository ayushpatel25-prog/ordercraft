package com.ordercraft.service;

import com.ordercraft.dto.order.SalesOrderRequest;
import com.ordercraft.dto.order.SalesOrderResponse;
import com.ordercraft.entity.SalesOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface SalesOrderService {
    Page<SalesOrderResponse> getOrders(String query, Pageable pageable);
    List<SalesOrderResponse> getOrdersByStatus(SalesOrder.OrderStatus status);
    List<SalesOrderResponse> getCustomerOrders(Long customerId);
    SalesOrderResponse getOrderById(Long id);
    SalesOrderResponse createOrder(SalesOrderRequest request);
    SalesOrderResponse confirmOrder(Long id);
    SalesOrderResponse cancelOrder(Long id);
}
