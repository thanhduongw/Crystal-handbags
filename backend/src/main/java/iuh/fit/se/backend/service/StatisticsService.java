package iuh.fit.se.backend.service;

import java.math.BigDecimal;
import java.util.Map;

public interface StatisticsService {
    Map<String, Object> getOverviewStatistics();
    Map<String, Object> getRevenueStatistics(int year, int month);
    Map<String, Object> getTopSellingProducts(int limit);
}