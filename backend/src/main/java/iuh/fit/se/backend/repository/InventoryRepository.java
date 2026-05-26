package iuh.fit.se.backend.repository;

import iuh.fit.se.backend.model.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    Optional<Inventory> findByProductItemItemId(Long itemId);

    @Modifying
    @Query("""
                update Inventory i
                set i.stockQuantity = i.stockQuantity - :qty,
                    i.soldQuantity = i.soldQuantity + :qty
                where i.productItem.itemId = :itemId
                  and i.stockQuantity >= :qty
            """)
    int decreaseStock(@Param("itemId") Long itemId, @Param("qty") int qty);

    @Modifying
    @Query("""
                update Inventory i
                set i.stockQuantity = i.stockQuantity + :qty
                where i.productItem.itemId = :itemId
            """)
    int increaseStock(@Param("itemId") Long itemId, @Param("qty") int qty);

    @Modifying
    @Query("""
                update Inventory i
                set i.reservedQuantity = i.reservedQuantity + :qty
                where i.productItem.itemId = :itemId
                  and (i.stockQuantity - i.reservedQuantity) >= :qty
            """)
    int reserveStock(@Param("itemId") Long itemId, @Param("qty") int qty);

    @Modifying
    @Query("""
                update Inventory i
                set i.reservedQuantity = i.reservedQuantity - :qty
                where i.productItem.itemId = :itemId
                  and i.reservedQuantity >= :qty
            """)
    int releaseReservedStock(@Param("itemId") Long itemId, @Param("qty") int qty);
}
