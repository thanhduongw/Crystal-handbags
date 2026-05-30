package iuh.fit.se.backend.service.impl;

import iuh.fit.se.backend.constants.RedisKeyConstants;
import iuh.fit.se.backend.dto.CartLineDto;
import iuh.fit.se.backend.dto.RedisCartItemDto;
import iuh.fit.se.backend.model.Product;
import iuh.fit.se.backend.model.ProductItem;
import iuh.fit.se.backend.model.User;
import iuh.fit.se.backend.repository.ProductItemRepository;
import iuh.fit.se.backend.repository.UserRepository;
import iuh.fit.se.backend.service.CartService;
import iuh.fit.se.backend.service.DatabaseCartService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Service
@Primary
@RequiredArgsConstructor
public class RedisCartServiceImpl implements CartService, DatabaseCartService {

    private static final Duration CART_TTL = Duration.ofDays(30);

    private final RedisTemplate<String, Object> redisTemplate;
    private final UserRepository userRepository;
    private final ProductItemRepository productItemRepository;

    @Override
    public List<CartLineDto> getAllCart(String email) {
        String key = userCartKey(email);
        List<CartLineDto> result = new ArrayList<>();

        redisTemplate.opsForHash().values(key).forEach(value -> {
            RedisCartItemDto item = (RedisCartItemDto) value;
            result.add(toCartLine(item));
        });

        refreshCartTtl(key);
        return result;
    }

    @Override
    public void addCartItem(String email, Long productItemId, int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be greater than zero");
        }

        String key = userCartKey(email);
        String field = itemField(productItemId);
        RedisCartItemDto existing = (RedisCartItemDto) redisTemplate.opsForHash().get(key, field);

        if (existing != null) {
            existing.setQuantity(existing.getQuantity() + quantity);
            redisTemplate.opsForHash().put(key, field, existing);
        } else {
            redisTemplate.opsForHash().put(key, field, buildCartItem(productItemId, quantity));
        }
        refreshCartTtl(key);
    }

    @Override
    public void updateQuantity(String email, Long productItemId, int quantity) {
        String key = userCartKey(email);
        String field = itemField(productItemId);

        if (quantity <= 0) {
            redisTemplate.opsForHash().delete(key, field);
            refreshCartTtl(key);
            return;
        }

        RedisCartItemDto existing = (RedisCartItemDto) redisTemplate.opsForHash().get(key, field);
        if (existing == null) {
            throw new RuntimeException("Cart item not found");
        }

        existing.setQuantity(quantity);
        redisTemplate.opsForHash().put(key, field, existing);
        refreshCartTtl(key);
    }

    @Override
    public void removeCartItem(String email, Long productItemId) {
        String key = userCartKey(email);
        redisTemplate.opsForHash().delete(key, itemField(productItemId));
        refreshCartTtl(key);
    }

    @Override
    public void clearCart(String email) {
        redisTemplate.delete(userCartKey(email));
    }

    @Override
    public void mergeSessionCart(String email, List<CartLineDto> sessionCart) {
        if (sessionCart == null || sessionCart.isEmpty()) {
            return;
        }
        for (CartLineDto line : sessionCart) {
            addCartItem(email, line.getItemId(), line.getQty());
        }
    }

    private RedisCartItemDto buildCartItem(Long productItemId, int quantity) {
        ProductItem productItem = productItemRepository.findById(productItemId)
                .orElseThrow(() -> new RuntimeException("Product item not found: " + productItemId));
        Product product = productItem.getProduct();

        return RedisCartItemDto.builder()
                .productId(product.getProductId())
                .variantId(productItem.getItemId())
                .productName(product.getName())
                .avatar(product.getAvatar())
                .color(productItem.getColor())
                .priceSnapshot(productItem.getPrice())
                .quantity(quantity)
                .build();
    }

    private CartLineDto toCartLine(RedisCartItemDto item) {
        return CartLineDto.builder()
                .itemId(item.getVariantId())
                .name(item.getProductName())
                .avatar(item.getAvatar())
                .price(item.getPriceSnapshot())
                .color(item.getColor())
                .qty(item.getQuantity() != null ? item.getQuantity() : 0)
                .build();
    }

    private String userCartKey(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return RedisKeyConstants.userCartKey(user.getUserId());
    }

    private String itemField(Long productItemId) {
        return String.valueOf(productItemId);
    }

    private void refreshCartTtl(String key) {
        redisTemplate.expire(key, CART_TTL);
    }
}
