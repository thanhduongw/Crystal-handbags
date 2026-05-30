package iuh.fit.se.backend.controller;

import iuh.fit.se.backend.dto.CartLineDto;
import iuh.fit.se.backend.dto.CheckoutRequest;
import iuh.fit.se.backend.dto.CheckoutResponse;
import iuh.fit.se.backend.service.CartService;
import iuh.fit.se.backend.service.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;
    private final OrderService orderService;

    @GetMapping
    public ResponseEntity<?> getCart(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(
                cartService.getAllCart(requireSubject(jwt)));
    }

    @PostMapping("/items")
    public ResponseEntity<Void> addItem(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody CartLineDto dto) {

        cartService.addCartItem(
                requireSubject(jwt),
                dto.getItemId(),
                dto.getQty());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PutMapping("/items/{itemId}")
    public ResponseEntity<Void> updateQuantity(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long itemId,
            @RequestParam int quantity) {

        cartService.updateQuantity(
                requireSubject(jwt),
                itemId,
                quantity);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<Void> removeItem(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long itemId) {

        cartService.removeCartItem(
                requireSubject(jwt),
                itemId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> clearCart(@AuthenticationPrincipal Jwt jwt) {

        cartService.clearCart(requireSubject(jwt));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody CheckoutRequest request,
            HttpServletRequest httpRequest) {

        CheckoutResponse response = orderService.createOrder(
                requireSubject(jwt),
                request,
                getClientIp(httpRequest));

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    private String requireSubject(Jwt jwt) {
        if (jwt == null || jwt.getSubject() == null || jwt.getSubject().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing or invalid JWT");
        }
        return jwt.getSubject();
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
}
