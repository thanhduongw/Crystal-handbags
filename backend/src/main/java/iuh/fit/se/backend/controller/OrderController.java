package iuh.fit.se.backend.controller;

import iuh.fit.se.backend.dto.OrderDetailDto;
import iuh.fit.se.backend.dto.OrderListDto;
import iuh.fit.se.backend.model.OrderStatus;
import iuh.fit.se.backend.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
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
            @RequestParam(required = false) OrderStatus status) {

        return ResponseEntity.ok(
                status == null
                        ? orderService.getAll()
                        : orderService.getByStatus(status)
        );
    }

    /* ======================= DETAIL ======================= */
    @GetMapping("/{id}")
    public ResponseEntity<OrderDetailDto> getDetail(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getDetail(id));
    }
}
