package com.ordercraft.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryResponse {
    private Long totalOrders;
    private Long pendingOrders;
    private Long productionOrders;
    private Long completedOrders;
    private Long lowStockItems;
    private Long pendingPurchaseOrders;
    private Long outstandingInvoices;
    private BigDecimal totalRevenue;
    private BigDecimal pendingPayments;
    private BigDecimal collectedPayments;

    // Chart Series data
    private List<Map<String, Object>> ordersTrend;
    private List<Map<String, Object>> revenueTrend;
    private List<Map<String, Object>> productionStatusDistribution;
    private List<Map<String, Object>> inventoryLevels;
    private List<Map<String, Object>> orderStatusDistribution;
}
