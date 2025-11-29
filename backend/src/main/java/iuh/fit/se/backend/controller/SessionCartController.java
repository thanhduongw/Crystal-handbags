package iuh.fit.se.backend.controller;

import iuh.fit.se.backend.dto.CartLineDto;
import iuh.fit.se.backend.service.SessionCartService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/session-cart")
@RequiredArgsConstructor
public class SessionCartController {
    private final SessionCartService sessionCartService;

    @GetMapping
    public List<CartLineDto> getCart(HttpSession session) {
        return sessionCartService.getCart(session);
    }

    @PostMapping("/items")
    @ResponseStatus(HttpStatus.CREATED)
    public void addItem(HttpSession session, @Valid @RequestBody CartLineDto dto) {
        sessionCartService.addItem(session, dto);
    }

    @PatchMapping("/items/{itemId}")
    public void updateQty(HttpSession session,
                          @PathVariable Long itemId,
                          @RequestParam int delta) {
        sessionCartService.updateQty(session, itemId, delta);
    }

    @DeleteMapping("/items/{itemId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeItem(HttpSession session, @PathVariable Long itemId) {
        sessionCartService.removeItem(session, itemId);
    }
}
