package iuh.fit.se.backend.controller;

import iuh.fit.se.backend.dto.CartLineDto;
import iuh.fit.se.backend.dto.CheckoutRequest;
import iuh.fit.se.backend.dto.OrderDetailDto;
import iuh.fit.se.backend.model.User;
import iuh.fit.se.backend.service.DatabaseCartService;
import iuh.fit.se.backend.service.OrderService;
import iuh.fit.se.backend.service.SessionCartService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {
    private final SessionCartService sessionCartService;
    private final DatabaseCartService databaseCartService;
    private final OrderService orderService;

//    (required = false)

    @GetMapping
    public ResponseEntity<?> getCart(@AuthenticationPrincipal User user,
                                     HttpSession session) {
        if (user != null) {
            return ResponseEntity.ok(databaseCartService.getAllCart(user.getEmail()));
        } else {
            return ResponseEntity.ok(sessionCartService.getAllCart(session));
        }
    }

    @PostMapping("/items")
    public ResponseEntity<?> addItem(@AuthenticationPrincipal User user,
                                     HttpSession session,
                                     @RequestBody CartLineDto dto) {
        if (user != null) {
            databaseCartService.addCartItem(user.getEmail(), dto.getItemId(), dto.getQty());
        } else {
            sessionCartService.addCartItem(session, dto);
        }
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PutMapping("/items/{itemId}")
    public ResponseEntity<?> updateQuantity(@AuthenticationPrincipal User user,
                                            HttpSession session,
                                            @PathVariable Long itemId,
                                            @RequestParam int quantity) {
        if (user != null) {
            databaseCartService.updateQuantity(user.getEmail(), itemId, quantity);
        } else {
            sessionCartService.updateCartQuantity(session, itemId, quantity -
                    sessionCartService.getAllCart(session).stream()
                            .filter(i -> i.getItemId().equals(itemId))
                            .findFirst()
                            .map(CartLineDto::getQty)
                            .orElse(0));
        }
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<?> removeItem(@AuthenticationPrincipal User user,
                                        HttpSession session,
                                        @PathVariable Long itemId) {
        if (user != null) {
            databaseCartService.removeCartItem(user.getEmail(), itemId);
        } else {
            sessionCartService.removeCartItem(session, itemId);
        }
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<?> clearCart(@AuthenticationPrincipal User user,
                                       HttpSession session) {
        if (user != null) {
            databaseCartService.clearCart(user.getEmail());
        } else {
            sessionCartService.clearCart(session);
        }
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/checkout")
    public ResponseEntity<?> checkout(@AuthenticationPrincipal User user,
                                      @RequestBody CheckoutRequest request) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        OrderDetailDto order = orderService.createOrder(user.getEmail(), request.getAddressId());
        return ResponseEntity.status(HttpStatus.CREATED).body(order);
    }
}