package com.ordercraft.controller;

import com.ordercraft.dto.dashboard.DashboardSummaryResponse;
import com.ordercraft.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Real-time role-aware KPI statistics and operational charts")
public class DashboardController {

    private final DashboardService dashboardService;

    @Operation(summary = "Get role-specific dashboard summary with KPIs and chart trends")
    @GetMapping("/summary")
    public ResponseEntity<DashboardSummaryResponse> getSummary(Authentication authentication) {
        String role = "ADMIN";
        if (authentication != null && authentication.getAuthorities() != null && !authentication.getAuthorities().isEmpty()) {
            role = authentication.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .findFirst()
                    .orElse("ROLE_ADMIN")
                    .replace("ROLE_", "");
        }
        return ResponseEntity.ok(dashboardService.getDashboardSummary(role));
    }
}
