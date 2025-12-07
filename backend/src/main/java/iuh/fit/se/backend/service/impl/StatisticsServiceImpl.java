package iuh.fit.se.backend.service.impl;

import iuh.fit.se.backend.model.Order;
import iuh.fit.se.backend.model.OrderStatus;
import iuh.fit.se.backend.repository.OrderRepository;
import iuh.fit.se.backend.repository.ProductRepository;
import iuh.fit.se.backend.repository.UserRepository;
import iuh.fit.se.backend.service.StatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatisticsServiceImpl implements StatisticsService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    @Override
    public Map<String, Object> getOverviewStatistics() {
        Map<String, Object> stats = new HashMap<>();

        // Total revenue
        BigDecimal totalRevenue = orderRepository.findAll().stream()
                .filter(o -> o.getStatus() == OrderStatus.DELIVERED)
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Total orders
        long totalOrders = orderRepository.count();

        // Total users
        long totalUsers = userRepository.count();

        // Total products
        long totalProducts = productRepository.count();

        // Pending orders
        long pendingOrders = orderRepository.findByStatus(OrderStatus.PENDING).size();

        stats.put("totalRevenue", totalRevenue);
        stats.put("totalOrders", totalOrders);
        stats.put("totalUsers", totalUsers);
        stats.put("totalProducts", totalProducts);
        stats.put("pendingOrders", pendingOrders);

        return stats;
    }

    @Override
    public Map<String, Object> getRevenueStatistics(int year, int month) {
        Map<String, Object> stats = new HashMap<>();

        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDateTime startDate = yearMonth.atDay(1).atStartOfDay();
        LocalDateTime endDate = yearMonth.atEndOfMonth().atTime(23, 59, 59);

        List<Order> orders = orderRepository.findAll().stream()
                .filter(o -> o.getOrderDate().isAfter(startDate) && o.getOrderDate().isBefore(endDate))
                .filter(o -> o.getStatus() == OrderStatus.DELIVERED)
                .collect(Collectors.toList());

        // Revenue by day
        Map<Integer, BigDecimal> revenueByDay = new TreeMap<>();
        for (int day = 1; day <= yearMonth.lengthOfMonth(); day++) {
            revenueByDay.put(day, BigDecimal.ZERO);
        }

        for (Order order : orders) {
            int day = order.getOrderDate().getDayOfMonth();
            revenueByDay.merge(day, order.getTotalAmount(), BigDecimal::add);
        }

        // Total revenue for the month
        BigDecimal monthlyRevenue = orders.stream()
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Number of orders
        long orderCount = orders.size();

        stats.put("revenueByDay", revenueByDay);
        stats.put("monthlyRevenue", monthlyRevenue);
        stats.put("orderCount", orderCount);
        stats.put("year", year);
        stats.put("month", month);

        return stats;
    }

    @Override
    public Map<String, Object> getTopSellingProducts(int limit) {
        Map<String, Object> result = new HashMap<>();

        // Get all delivered orders
        List<Order> deliveredOrders = orderRepository.findByStatus(OrderStatus.DELIVERED);

        // Count items sold
        Map<Long, Integer> productSales = new HashMap<>();
        Map<Long, String> productNames = new HashMap<>();
        Map<Long, BigDecimal> productRevenue = new HashMap<>();

        for (Order order : deliveredOrders) {
            order.getOrderItems().forEach(item -> {
                Long productId = item.getProductItem().getProduct().getProductId();
                String productName = item.getProductItem().getProduct().getName();

                productSales.merge(productId, item.getQuantity(), Integer::sum);
                productNames.put(productId, productName);

                BigDecimal itemRevenue = item.getPrice().multiply(new BigDecimal(item.getQuantity()));
                productRevenue.merge(productId, itemRevenue, BigDecimal::add);
            });
        }

        // Sort by quantity sold and get top N
        List<Map<String, Object>> topProducts = productSales.entrySet().stream()
                .sorted(Map.Entry.<Long, Integer>comparingByValue().reversed())
                .limit(limit)
                .map(entry -> {
                    Map<String, Object> product = new HashMap<>();
                    product.put("productId", entry.getKey());
                    product.put("productName", productNames.get(entry.getKey()));
                    product.put("quantitySold", entry.getValue());
                    product.put("revenue", productRevenue.get(entry.getKey()));
                    return product;
                })
                .collect(Collectors.toList());

        result.put("topProducts", topProducts);
        result.put("limit", limit);

        return result;
    }
}