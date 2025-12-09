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

@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
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

    // THÊM: Endpoint clear session cart còn thiếu
    @DeleteMapping
    public ResponseEntity<Void> clearCart(HttpSession session) {
        sessionCartService.clearCart(session);
        return ResponseEntity.noContent().build();
    }
    @PostMapping("/merge")
    public ResponseEntity<Void> mergeSessionCart(
            @AuthenticationPrincipal Jwt jwt,
            HttpSession session) {

        // Lấy session cart
        List<CartLineDto> sessionCart = sessionCartService.getAllCart(session);

        // Merge vào database
        if (!sessionCart.isEmpty()) {
            databaseCartService.mergeSessionCart(jwt.getSubject(), sessionCart);
            // Xóa session cart sau merge
            sessionCartService.clearCart(session);
        }

        return ResponseEntity.ok().build();
    }
}
