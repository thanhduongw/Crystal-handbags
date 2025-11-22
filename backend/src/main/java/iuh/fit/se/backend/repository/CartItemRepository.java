package iuh.fit.se.backend.repository;

import iuh.fit.se.backend.model.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CartItemRepository  extends JpaRepository<CartItem, Long> {
}
