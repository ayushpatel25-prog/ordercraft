package com.ordercraft.service;

import com.ordercraft.dto.dashboard.DashboardSummaryResponse;

public interface DashboardService {
    DashboardSummaryResponse getDashboardSummary(String role);
}
