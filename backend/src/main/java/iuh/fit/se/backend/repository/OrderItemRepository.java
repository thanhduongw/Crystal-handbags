package iuh.fit.se.backend.repository;

import iuh.fit.se.backend.model.OrderItem;
import iuh.fit.se.backend.model.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    boolean existsByProductItemProductProductId(Long productId);
    boolean existsByProductItemProductProductIdAndOrderStatusIn(Long productId, Collection<OrderStatus> statuses);
}
