package iuh.fit.se.backend.service.impl;

import iuh.fit.se.backend.dto.CartLineDto;
import iuh.fit.se.backend.model.Cart;
import iuh.fit.se.backend.model.CartItem;
import iuh.fit.se.backend.model.ProductItem;
import iuh.fit.se.backend.model.User;
import iuh.fit.se.backend.repository.CartItemRepository;
import iuh.fit.se.backend.repository.CartRepository;
import iuh.fit.se.backend.repository.ProductItemRepository;
import iuh.fit.se.backend.repository.UserRepository;
import iuh.fit.se.backend.service.SessionCartService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SessionCartServiceImpl implements SessionCartService {
    private static final String CART_ATTR = "GUEST_CART";
    private final CartItemRepository cartItemRepository;
    private final ProductItemRepository productItemRepository;
    private final UserRepository userRepository;
    private final CartRepository cartRepository;

    @SuppressWarnings("unchecked")
    @Override
    public List<CartLineDto> getAllCart(HttpSession session) {
        List<CartLineDto> cart = (List<CartLineDto>) session.getAttribute(CART_ATTR);
        return cart == null ? new ArrayList<>() : cart;
    }

    @Override
    public void addCartItem(HttpSession session, CartLineDto dto) {
        List<CartLineDto> cart = getAllCart(session);
        cart.stream()
                .filter(l -> l.getItemId().equals(dto.getItemId()))
                .findFirst()
                .ifPresentOrElse(
                        l -> l.setQty(l.getQty() + dto.getQty()),
                        () -> cart.add(dto));
        session.setAttribute(CART_ATTR, cart);
    }

    @Override
    public void updateCartQuantity(HttpSession session, Long itemId, int quantity) {
        List<CartLineDto> cart = getAllCart(session);

        if (quantity <= 0) {
            cart.removeIf(l -> l.getItemId().equals(itemId));
        } else {
            cart.stream()
                    .filter(l -> l.getItemId().equals(itemId))
                    .findFirst()
                    .ifPresentOrElse(
                            l -> l.setQty(quantity),
                            () -> { throw new RuntimeException("Cart item not found"); }
                    );
        }
        session.setAttribute(CART_ATTR, cart);
    }

    @Override
    public void removeCartItem(HttpSession session, Long itemId) {
        List<CartLineDto> cart = getAllCart(session);
        cart.removeIf(l -> l.getItemId().equals(itemId));
        session.setAttribute(CART_ATTR, cart);
    }

    @Override
    public void clearCart(HttpSession session) {
        session.removeAttribute(CART_ATTR);
    }

    // FIX CHÍNH: Tạo cart nếu chưa tồn tại, fetch user/cart ngoài vòng lặp
    @Override
    @Transactional
    public void mergeSessionCart(String email, List<CartLineDto> sessionCart) {
        if (sessionCart.isEmpty()) {
            log.info("No session cart to merge for user: {}", email);
            return;
        }

        log.info("Merging {} session cart items for user: {}", sessionCart.size(), email);

        // Fetch user và cart MỘT LẦN ngoài vòng lặp
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));

        // FIX QUAN TRỌNG: Tạo cart mới nếu chưa tồn tại
        Cart cart = cartRepository.findByUserUserId(user.getUserId())
                .orElseGet(() -> createCart(user));

        // Merge từng item
        for (CartLineDto line : sessionCart) {
            CartItem existingItem = cartItemRepository
                    .findByCartCartIdAndProductItemItemId(cart.getCartId(), line.getItemId())
                    .orElse(null);

            if (existingItem != null) {
                existingItem.setQuantity(existingItem.getQuantity() + line.getQty());
                cartItemRepository.save(existingItem);
                log.debug("Updated existing cart item: {} with quantity: {}", line.getItemId(), existingItem.getQuantity());
            } else {
                ProductItem productItem = productItemRepository.findById(line.getItemId())
                        .orElseThrow(() -> new RuntimeException("Product item not found: " + line.getItemId()));
                CartItem newItem = CartItem.builder()
                        .cart(cart)
                        .productItem(productItem)
                        .quantity(line.getQty())
                        .build();
                cartItemRepository.save(newItem);
                log.debug("Added new cart item: {} with quantity: {}", line.getItemId(), line.getQty());
            }
        }

        log.info("Successfully merged session cart for user: {}", email);
    }

    private Cart createCart(User user) {
        log.info("Creating new cart for user: {}", user.getEmail());
        Cart cart = Cart.builder()
                .user(user)
                .build();
        return cartRepository.save(cart);
    }
}