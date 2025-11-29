package iuh.fit.se.backend.service;

import iuh.fit.se.backend.dto.CartLineDto;
import jakarta.servlet.http.HttpSession;

import java.util.List;

public interface SessionCartService {
    List<CartLineDto> getCart(HttpSession session);

    void addItem(HttpSession session, CartLineDto dto);

    void updateQty(HttpSession session, Long itemId, int delta);

    void removeItem(HttpSession session, Long itemId);

    void clearCart(HttpSession session);
}
