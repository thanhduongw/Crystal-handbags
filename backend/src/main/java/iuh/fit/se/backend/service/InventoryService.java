package iuh.fit.se.backend.service;

import iuh.fit.se.backend.model.Inventory;
import iuh.fit.se.backend.model.ProductItem;

public interface InventoryService {
    Inventory getByItemId(Long itemId);

    boolean checkAvailability(Long itemId, int qty);

    void decreaseStock(Long itemId, int qty);

    void increaseStock(Long itemId, int qty);

    void reserveStock(Long itemId, int qty);

    void releaseReservedStock(Long itemId, int qty);

    Inventory initInventoryForItem(ProductItem item, int stockQty);

    void updateStock(Long itemId, int stockQty);
}
