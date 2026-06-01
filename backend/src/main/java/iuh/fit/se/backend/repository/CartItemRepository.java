package iuh.fit.se.backend.repository;

import iuh.fit.se.backend.model.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository  extends JpaRepository<CartItem, Long> {
    List<CartItem> findByCartCartId(Long cartId);
    Optional<CartItem> findByCartCartIdAndProductItemItemId(Long cartId, Long productItemId);
    void deleteByCartCartIdAndProductItemItemId(Long cartId, Long productItemId);
    void deleteByCartCartId(Long cartId);
    boolean existsByProductItemItemId(Long productItemId);
    void deleteByProductItemItemId(Long productItemId);
    boolean existsByProductItemProductProductId(Long productId);
    void deleteByProductItemProductProductId(Long productId);
}
