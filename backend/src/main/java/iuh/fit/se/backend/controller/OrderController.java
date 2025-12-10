package iuh.fit.se.backend.controller;

import iuh.fit.se.backend.dto.OrderDetailDto;
import iuh.fit.se.backend.dto.OrderListDto;
import iuh.fit.se.backend.model.OrderStatus;
import iuh.fit.se.backend.model.User;
import iuh.fit.se.backend.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @GetMapping
    public ResponseEntity<List<OrderListDto>> getOrders(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) OrderStatus status) {

        String email = jwt.getSubject();
        List<OrderListDto> orders = (status == null)
                ? orderService.getUserOrders(email)
                : orderService.getUserOrdersByStatus(email, status);

        return ResponseEntity.ok(orders);
    }


    @GetMapping("/{id}")
    public ResponseEntity<OrderDetailDto> getOrderDetail(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long id) {
        Long userId = jwt.getClaim("userId");
        OrderDetailDto order = orderService.getOrderDetail(id);
        if (!order.getUserId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(order);
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<Void> cancelOrder(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long id) {

        if (jwt == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Long userId = jwt.getClaim("userId");

        OrderDetailDto order = orderService.getOrderDetail(id);

        if (!order.getUserId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        orderService.cancelOrder(id);
        return ResponseEntity.ok().build();
    }

}

