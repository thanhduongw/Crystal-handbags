package iuh.fit.se.backend.service;

import iuh.fit.se.backend.dto.CartLineDto;
import jakarta.servlet.http.HttpSession;

import java.util.List;

public interface SessionCartService {
    List<CartLineDto> getAllCart(HttpSession session);
    void addCartItem(HttpSession session, CartLineDto dto);
    void updateCartQuantity(HttpSession session, Long itemId, int delta);
    void removeCartItem(HttpSession session, Long itemId);
    void clearCart(HttpSession session);
    void mergeSessionCart(String email, List<CartLineDto> sessionCart);
}
