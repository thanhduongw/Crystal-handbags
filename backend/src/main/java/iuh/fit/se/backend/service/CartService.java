package iuh.fit.se.backend.service;

import iuh.fit.se.backend.dto.CartLineDto;

import java.util.List;

public interface CartService {
    List<CartLineDto> getAllCart(String email);

    void addCartItem(String email, Long productItemId, int quantity);

    void updateQuantity(String email, Long productItemId, int quantity);

    void removeCartItem(String email, Long productItemId);

    void clearCart(String email);

    void mergeSessionCart(String email, List<CartLineDto> sessionCart);
}
