package iuh.fit.se.backend.controller;

import iuh.fit.se.backend.dto.CartLineDto;
import iuh.fit.se.backend.dto.CheckoutRequest;
import iuh.fit.se.backend.dto.OrderDetailDto;
import iuh.fit.se.backend.service.DatabaseCartService;
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
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final DatabaseCartService databaseCartService;
    private final OrderService orderService;

    @GetMapping
    public ResponseEntity<?> getCart(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(
                databaseCartService.getAllCart(jwt.getSubject())
        );
    }

    @PostMapping("/items")
    public ResponseEntity<Void> addItem(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody CartLineDto dto) {

        databaseCartService.addCartItem(
                jwt.getSubject(),
                dto.getItemId(),
                dto.getQty()
        );
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PutMapping("/items/{itemId}")
    public ResponseEntity<Void> updateQuantity(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long itemId,
            @RequestParam int quantity) {

        databaseCartService.updateQuantity(
                jwt.getSubject(),
                itemId,
                quantity
        );
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<Void> removeItem(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long itemId) {

        databaseCartService.removeCartItem(
                jwt.getSubject(),
                itemId
        );
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> clearCart(@AuthenticationPrincipal Jwt jwt) {

        databaseCartService.clearCart(jwt.getSubject());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/checkout")
    public ResponseEntity<OrderDetailDto> checkout(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody CheckoutRequest request) {

        // TODO: Sử dụng request.getPaymentMethod() để xử lý thanh toán
        OrderDetailDto order = orderService.createOrder(
                jwt.getSubject(),
                request.getAddressId()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }
}