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
    public ResponseEntity<?> updateQuantity(
            @AuthenticationPrincipal User user,
            HttpSession session,
            @PathVariable Long itemId,
            @RequestParam int quantity) {

        if (user != null) {
            databaseCartService.updateQuantity(user.getEmail(), itemId, quantity);
        } else {
            sessionCartService.updateCartQuantity(session, itemId, quantity);
        }
        return ResponseEntity.ok().build();
    }


    @DeleteMapping("/items/{itemId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeItem(HttpSession session, @PathVariable Long itemId) {
        sessionCartService.removeCartItem(session, itemId);
    }
}
