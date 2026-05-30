package iuh.fit.se.backend.service.impl;

import iuh.fit.se.backend.constants.RedisKeyConstants;
import iuh.fit.se.backend.model.ProductItem;
import iuh.fit.se.backend.repository.ProductItemRepository;
import iuh.fit.se.backend.service.CacheInvalidationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class CacheInvalidationServiceImpl implements CacheInvalidationService {

    private final CacheManager cacheManager;
    private final ProductItemRepository productItemRepository;

    @Override
    public void evictProductDetail(Long productId) {
        if (productId == null) {
            return;
        }
        Cache cache = cacheManager.getCache(RedisKeyConstants.Cache.PRODUCT_DETAIL);
        if (cache != null) {
            cache.evict(productId);
        }
    }

    @Override
    public void evictProductCaches() {
        clearCache(RedisKeyConstants.Cache.PRODUCT_LIST);
        clearCache(RedisKeyConstants.Cache.PRODUCT_DETAIL);
    }

    @Override
    public void evictCategoryCaches() {
        clearCache(RedisKeyConstants.Cache.CATEGORY);
    }

    @Override
    public void evictCategory(Long categoryId) {
        Cache cache = cacheManager.getCache(RedisKeyConstants.Cache.CATEGORY);
        if (cache != null && categoryId != null) {
            cache.evict(categoryId);
        }
    }

    @Override
    public void evictProductCachesForVariant(Long variantId) {
        productItemRepository.findById(variantId)
                .map(ProductItem::getProduct)
                .ifPresent(product -> evictProductDetail(product.getProductId()));
        clearCache(RedisKeyConstants.Cache.PRODUCT_LIST);
    }

    private void clearCache(String cacheName) {
        Cache cache = cacheManager.getCache(cacheName);
        if (cache != null) {
            cache.clear();
            log.debug("Cleared Redis cache {}", cacheName);
        }
    }
}
