package iuh.fit.se.backend.controller;

import iuh.fit.se.backend.dto.CartLineDto;
import iuh.fit.se.backend.model.User;
import iuh.fit.se.backend.service.DatabaseCartService;
import iuh.fit.se.backend.service.SessionCartService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/session-cart")
@RequiredArgsConstructor
public class SessionCartController {
    private final SessionCartService sessionCartService;
    private final DatabaseCartService databaseCartService;

    @GetMapping
    public List<CartLineDto> getCart(HttpSession session) {
        return sessionCartService.getAllCart(session);
    }

    @PostMapping("/items")
    @ResponseStatus(HttpStatus.CREATED)
    public void addItem(HttpSession session, @Valid @RequestBody CartLineDto dto) {
        sessionCartService.addCartItem(session, dto);
    }

    @PutMapping("/items/{itemId}")
    public ResponseEntity<Void> updateQuantity(
            HttpSession session,
            @PathVariable Long itemId,
            @RequestParam int quantity) {

        sessionCartService.updateCartQuantity(session, itemId, quantity);
        return ResponseEntity.ok().build();
    }

    // Xóa một sản phẩm khỏi giỏ hàng guest theo itemId
    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<Void> removeItem(
            HttpSession session,
            @PathVariable Long itemId) {
        sessionCartService.removeCartItem(session, itemId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> clearCart(HttpSession session) {
        sessionCartService.clearCart(session);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/merge")
    public ResponseEntity<Void> mergeSessionCart(
            @AuthenticationPrincipal Jwt jwt,
            HttpSession session) {

        List<CartLineDto> sessionCart = sessionCartService.getAllCart(session);

        if (!sessionCart.isEmpty()) {
            databaseCartService.mergeSessionCart(jwt.getSubject(), sessionCart);
            sessionCartService.clearCart(session);
        }

        return ResponseEntity.ok().build();
    }
}