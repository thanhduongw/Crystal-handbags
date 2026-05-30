package iuh.fit.se.backend.service.impl;

import iuh.fit.se.backend.model.Inventory;
import iuh.fit.se.backend.model.ProductItem;
import iuh.fit.se.backend.repository.InventoryRepository;
import iuh.fit.se.backend.service.CacheInvalidationService;
import iuh.fit.se.backend.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InventoryServiceImpl implements InventoryService {

    private final InventoryRepository inventoryRepository;
    private final CacheInvalidationService cacheInvalidationService;

    @Override
    public Inventory getByItemId(Long itemId) {
        return inventoryRepository.findByProductItemItemId(itemId)
                .orElseThrow(() -> new RuntimeException("Inventory not found for item: " + itemId));
    }

    @Override
    public boolean checkAvailability(Long itemId, int qty) {
        Inventory inventory = getByItemId(itemId);
        return inventory.getAvailableQuantity() >= qty;
    }

    @Override
    @Transactional
    public void decreaseStock(Long itemId, int qty) {
        int updated = inventoryRepository.decreaseStock(itemId, qty);
        if (updated == 0) {
            throw new RuntimeException("Insufficient stock for item: " + itemId);
        }
        cacheInvalidationService.evictProductCachesForVariant(itemId);
    }

    @Override
    @Transactional
    public void increaseStock(Long itemId, int qty) {
        inventoryRepository.increaseStock(itemId, qty);
        cacheInvalidationService.evictProductCachesForVariant(itemId);
    }

    @Override
    @Transactional
    public void reserveStock(Long itemId, int qty) {
        int updated = inventoryRepository.reserveStock(itemId, qty);
        if (updated == 0) {
            throw new RuntimeException("Insufficient stock to reserve for item: " + itemId);
        }
        cacheInvalidationService.evictProductCachesForVariant(itemId);
    }

    @Override
    @Transactional
    public void releaseReservedStock(Long itemId, int qty) {
        int updated = inventoryRepository.releaseReservedStock(itemId, qty);
        if (updated == 0) {
            throw new RuntimeException("Reserved stock not enough for item: " + itemId);
        }
        cacheInvalidationService.evictProductCachesForVariant(itemId);
    }

    @Override
    @Transactional
    public Inventory initInventoryForItem(ProductItem item, int stockQty) {
        Inventory inventory = Inventory.builder()
                .productItem(item)
                .stockQuantity(stockQty)
                .reservedQuantity(0)
                .soldQuantity(0)
                .build();
        Inventory saved = inventoryRepository.save(inventory);
        cacheInvalidationService.evictProductCachesForVariant(item.getItemId());
        return saved;
    }

    @Override
    @Transactional
    public void updateStock(Long itemId, int stockQty) {
        Inventory inventory = getByItemId(itemId);
        inventory.setStockQuantity(stockQty);
        inventoryRepository.save(inventory);
        cacheInvalidationService.evictProductCachesForVariant(itemId);
    }
}
