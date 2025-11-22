package iuh.fit.se.backend.repository;

import iuh.fit.se.backend.model.ProductItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductItemRepository  extends JpaRepository<ProductItem, Long> {
    @Query(value = "select * from product_item where product_id = :productId", nativeQuery = true)
    List<ProductItem> findByProductId(@Param("productId") Long productId);
}
