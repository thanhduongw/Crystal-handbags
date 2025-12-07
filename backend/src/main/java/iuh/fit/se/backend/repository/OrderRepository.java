package iuh.fit.se.backend.repository;

import iuh.fit.se.backend.model.Order;
import iuh.fit.se.backend.model.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByStatus(OrderStatus status);
    List<Order> findByUserUserId(Long userId);
    @Query("SELECT o FROM Order o WHERE o.user.email = :email ORDER BY o.orderDate DESC")
    List<Order> findByUserEmail(@Param("email") String email);
}
