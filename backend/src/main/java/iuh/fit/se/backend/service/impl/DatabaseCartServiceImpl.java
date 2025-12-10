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
import iuh.fit.se.backend.service.DatabaseCartService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DatabaseCartServiceImpl implements DatabaseCartService {
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductItemRepository productItemRepository;
    private final UserRepository userRepository;

    @Override
    public List<CartLineDto> getAllCart(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Cart cart = cartRepository.findByUserUserId(user.getUserId())
                .orElseGet(() -> createCart(user));

        return cartItemRepository.findByCartCartId(cart.getCartId()).stream()
                .map(this::convertToCartLineDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void addCartItem(String email, Long productItemId, int quantity) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Cart cart = cartRepository.findByUserUserId(user.getUserId())
                .orElseGet(() -> createCart(user));

        ProductItem productItem = productItemRepository.findById(productItemId)
                .orElseThrow(() -> new RuntimeException("Product item not found"));

        CartItem existingItem = cartItemRepository
                .findByCartCartIdAndProductItemItemId(cart.getCartId(), productItemId)
                .orElse(null);

        if (existingItem != null) {
            existingItem.setQuantity(existingItem.getQuantity() + quantity);
            cartItemRepository.save(existingItem);
        } else {
            CartItem newItem = CartItem.builder()
                    .cart(cart)
                    .productItem(productItem)
                    .quantity(quantity)
                    .build();
            cartItemRepository.save(newItem);
        }
    }

    @Override
    @Transactional
    public void updateQuantity(String email, Long productItemId, int quantity) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Cart cart = cartRepository.findByUserUserId(user.getUserId())
                .orElseGet(() -> createCart(user));

        CartItem item = cartItemRepository
                .findByCartCartIdAndProductItemItemId(cart.getCartId(), productItemId)
                .orElseThrow(() -> new RuntimeException("Cart item not found"));

        if (quantity <= 0) {
            cartItemRepository.delete(item);
        } else {
            item.setQuantity(quantity);
            cartItemRepository.save(item);
        }
    }

    @Override
    @Transactional
    public void removeCartItem(String email, Long productItemId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Cart cart = cartRepository.findByUserUserId(user.getUserId())
                .orElseGet(() -> createCart(user));

        cartItemRepository.deleteByCartCartIdAndProductItemItemId(cart.getCartId(), productItemId);
    }

    @Override
    @Transactional
    public void clearCart(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Cart cart = cartRepository.findByUserUserId(user.getUserId())
                .orElseGet(() -> createCart(user));

        cartItemRepository.deleteByCartCartId(cart.getCartId());
    }

    @Override
    @Transactional
    public void mergeSessionCart(String email, List<CartLineDto> sessionCart) {
        // Fetch user and cart ONCE outside the loop
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Create cart if it doesn't exist
        Cart cart = cartRepository.findByUserUserId(user.getUserId())
                .orElseGet(() -> createCart(user));

        // Merge items
        for (CartLineDto line : sessionCart) {
            ProductItem productItem = productItemRepository.findById(line.getItemId())
                    .orElseThrow(() -> new RuntimeException("Product item not found: " + line.getItemId()));

            CartItem existingItem = cartItemRepository
                    .findByCartCartIdAndProductItemItemId(cart.getCartId(), line.getItemId())
                    .orElse(null);

            if (existingItem != null) {
                existingItem.setQuantity(existingItem.getQuantity() + line.getQty());
                cartItemRepository.save(existingItem);
            } else {
                CartItem newItem = CartItem.builder()
                        .cart(cart)
                        .productItem(productItem)
                        .quantity(line.getQty())
                        .build();
                cartItemRepository.save(newItem);
            }
        }
    }

    private Cart createCart(User user) {
        Cart cart = Cart.builder()
                .user(user)
                .build();
        return cartRepository.save(cart);
    }

    private CartLineDto convertToCartLineDto(CartItem cartItem) {
        return CartLineDto.builder()
                .itemId(cartItem.getProductItem().getItemId())
                .name(cartItem.getProductItem().getProduct().getName())
                .avatar(cartItem.getProductItem().getProduct().getAvatar())
                .price(cartItem.getProductItem().getPrice())
                .color(cartItem.getProductItem().getColor())
                .qty(cartItem.getQuantity())
                .build();
    }
}