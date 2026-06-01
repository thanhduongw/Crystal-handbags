package iuh.fit.se.backend.controller;

import iuh.fit.se.backend.dto.CartLineDto;
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
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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
            HttpSession session,
            @RequestBody(required = false) List<CartLineDto> clientCart) {
        if (jwt == null || jwt.getSubject() == null || jwt.getSubject().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing or invalid JWT");
        }

        List<CartLineDto> sessionCart = sessionCartService.getAllCart(session);
        List<CartLineDto> cartToMerge = normalizeCart(
                clientCart != null && !clientCart.isEmpty()
                        ? clientCart
                        : sessionCart);

        if (!cartToMerge.isEmpty()) {
            databaseCartService.mergeSessionCart(jwt.getSubject(), cartToMerge);
            sessionCartService.clearCart(session);
        }

        return ResponseEntity.ok().build();
    }

    private List<CartLineDto> normalizeCart(List<CartLineDto> cart) {
        Map<Long, CartLineDto> byItemId = new LinkedHashMap<>();

        for (CartLineDto line : cart) {
            if (line == null || line.getItemId() == null || line.getQty() <= 0) {
                continue;
            }

            CartLineDto existing = byItemId.get(line.getItemId());
            if (existing == null) {
                byItemId.put(line.getItemId(), CartLineDto.builder()
                        .itemId(line.getItemId())
                        .name(line.getName())
                        .avatar(line.getAvatar())
                        .price(line.getPrice())
                        .color(line.getColor())
                        .qty(line.getQty())
                        .build());
            } else {
                existing.setQty(existing.getQty() + line.getQty());
            }
        }

        return new ArrayList<>(byItemId.values());
    }
}
