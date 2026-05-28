package iuh.fit.se.backend.repository;

import iuh.fit.se.backend.model.ProductItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductItemRepository  extends JpaRepository<ProductItem, Long> {
    @Query("SELECT i FROM ProductItem i WHERE i.product.productId = :productId")
    List<ProductItem> findByProductId(@Param("productId") Long productId);
}
