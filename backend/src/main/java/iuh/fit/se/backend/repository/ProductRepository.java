package iuh.fit.se.backend.repository;

import iuh.fit.se.backend.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    @Query("SELECT p FROM Product p WHERE p.category.categoryId = :categoryId")
    List<Product> findByCategoryId(@Param("categoryId") Long categoryId);

    @Query("SELECT p FROM Product p WHERE LOWER(p.name) LIKE lower(concat('%', :keyword, '%')) " +
            "OR LOWER(p.description) LIKE lower(concat('%', :keyword, '%'))")
    List<Product> search(@Param("keyword") String keyword);
}
