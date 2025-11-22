package iuh.fit.se.backend.repository;

import iuh.fit.se.backend.model.ProductItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductItemRepository  extends JpaRepository<ProductItem, Long> {
}
