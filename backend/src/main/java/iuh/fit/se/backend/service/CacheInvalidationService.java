package iuh.fit.se.backend.service;

public interface CacheInvalidationService {
    void evictProductDetail(Long productId);

    void evictProductCaches();

    void evictCategoryCaches();

    void evictCategory(Long categoryId);

    void evictProductCachesForVariant(Long variantId);
}
