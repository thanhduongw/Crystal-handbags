package iuh.fit.se.backend.controller;

import iuh.fit.se.backend.dto.OrderDetailDto;
import iuh.fit.se.backend.dto.OrderListDto;
import iuh.fit.se.backend.model.OrderStatus;
import iuh.fit.se.backend.model.User;
import iuh.fit.se.backend.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @GetMapping
    public ResponseEntity<List<OrderListDto>> getOrders(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) OrderStatus status) {

        List<OrderListDto> orders = status == null
                ? orderService.getUserOrders(user.getEmail())
                : orderService.getOrdersByStatus(status);

        return ResponseEntity.ok(orders);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderDetailDto> getDetail(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {

        OrderDetailDto order = orderService.getOrderDetail(id);

        if (!order.getUserId().equals(user.getUserId())) {
            return ResponseEntity.status(403).build();
        }

        return ResponseEntity.ok(order);
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<Void> cancelOrder(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {

        OrderDetailDto order = orderService.getOrderDetail(id);

        if (!order.getUserId().equals(user.getUserId())) {
            return ResponseEntity.status(403).build();
        }

        orderService.cancelOrder(id);
        return ResponseEntity.ok().build();
    }
}
