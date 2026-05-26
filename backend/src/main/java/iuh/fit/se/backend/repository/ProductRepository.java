package iuh.fit.se.backend.repository;

import iuh.fit.se.backend.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {

    @Query("SELECT p FROM Product p WHERE p.category.categoryId = :categoryId")
    List<Product> findByCategoryId(@Param("categoryId") Long categoryId);

    @Query("""
                SELECT DISTINCT p
                FROM Product p
                LEFT JOIN p.items i
                JOIN p.category c
                WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(i.color) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
            """)
    List<Product> search(@Param("keyword") String keyword);

    @Query("""
                SELECT DISTINCT p
                FROM Product p
                JOIN p.items i
                LEFT JOIN i.inventory inv
                JOIN p.category c
                WHERE (:keyword IS NULL OR :keyword = ''
                    OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    OR LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                )
                AND (:color IS NULL OR :color = ''
                    OR LOWER(i.color) LIKE LOWER(CONCAT('%', :color, '%'))
                )
                AND (:minPrice IS NULL OR i.price >= :minPrice)
                AND (:maxPrice IS NULL OR i.price <= :maxPrice)
                AND (COALESCE(inv.stockQuantity, 0) - COALESCE(inv.reservedQuantity, 0)) > 0
            """)
    List<Product> searchAdvanced(
            @Param("keyword") String keyword,
            @Param("color") String color,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice);
}