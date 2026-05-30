package iuh.fit.se.backend.service.impl;

import iuh.fit.se.backend.constants.RedisKeyConstants;
import iuh.fit.se.backend.dto.ProductDetailDto;
import iuh.fit.se.backend.dto.ProductItemDto;
import iuh.fit.se.backend.dto.ProductListDto;
import iuh.fit.se.backend.model.Product;
import iuh.fit.se.backend.model.ProductItem;
import iuh.fit.se.backend.model.Category;
import iuh.fit.se.backend.repository.CategoryRepository;
import iuh.fit.se.backend.repository.InventoryRepository;
import iuh.fit.se.backend.repository.ProductItemRepository;
import iuh.fit.se.backend.repository.ProductRepository;
import iuh.fit.se.backend.service.CacheInvalidationService;
import iuh.fit.se.backend.service.FileUploadService;
import iuh.fit.se.backend.service.InventoryService;
import iuh.fit.se.backend.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {
    private final ProductRepository productRepository;
    private final ProductItemRepository productItemRepository;
    private final CategoryRepository categoryRepository;
    private final FileUploadService fileUploadService;
    private final InventoryService inventoryService;
    private final InventoryRepository inventoryRepository;
    private final CacheInvalidationService cacheInvalidationService;

    @Override
    @Transactional(readOnly = true)
    @Cacheable(cacheNames = RedisKeyConstants.Cache.PRODUCT_LIST, key = "'all'", unless = "#result == null")
    public List<ProductListDto> getAllProducts() {
        return productRepository.findAll().stream()
                .map(this::convertToListDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ProductDetailDto createProduct(ProductDetailDto productDto) {
        Category category = categoryRepository.findById(productDto.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found: " + productDto.getCategoryId()));

        Product product = Product.builder()
                .name(productDto.getName())
                .description(productDto.getDescription())
                .basePrice(productDto.getBasePrice())
                .avatar(productDto.getAvatar())
                .images(productDto.getImages() != null ? productDto.getImages() : new ArrayList<>())
                .category(category)
                .showHomepage(productDto.getShowHomePage() != null ? productDto.getShowHomePage() : false)
                .build();

        Product savedProduct = productRepository.save(product);

        // Tạo ProductItems (nếu có)
        if (productDto.getItems() != null && !productDto.getItems().isEmpty()) {
            for (ProductItemDto itemDto : productDto.getItems()) {
                ProductItem item = ProductItem.builder()
                        .product(savedProduct)
                        .color(itemDto.getColor())
                        .price(itemDto.getPrice())
                        .build();
                ProductItem savedItem = productItemRepository.save(item);
                int stockQty = itemDto.getStockQuantity() != null ? itemDto.getStockQuantity() : 0;
                inventoryService.initInventoryForItem(savedItem, stockQty);
            }
        }

        cacheInvalidationService.evictProductCaches();
        return getProductDetail(savedProduct.getProductId());
    }

    @Override
    @Transactional
    public ProductDetailDto updateProduct(Long id, ProductDetailDto productDto) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        Category category = categoryRepository.findById(productDto.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found: " + productDto.getCategoryId()));

        // Update thông tin product cơ bản
        product.setName(productDto.getName());
        product.setDescription(productDto.getDescription());
        product.setBasePrice(productDto.getBasePrice());
        product.setAvatar(productDto.getAvatar());
        product.setImages(productDto.getImages() != null ? productDto.getImages() : new ArrayList<>());
        product.setCategory(category);
        product.setShowHomepage(productDto.getShowHomePage() != null ? productDto.getShowHomePage() : false);

        productRepository.save(product);

        // Lấy danh sách item hiện có của product
        List<ProductItem> existingItems = productItemRepository.findByProductId(id);
        Map<Long, ProductItem> existingMap = existingItems.stream()
                .filter(i -> i.getItemId() != null)
                .collect(Collectors.toMap(ProductItem::getItemId, i -> i));

        // Tập hợp itemId nhận từ client
        Set<Long> incomingIds = new HashSet<>();
        if (productDto.getItems() != null) {
            for (ProductItemDto dto : productDto.getItems()) {
                if (dto.getItemId() != null) {
                    incomingIds.add(dto.getItemId());
                    // UPDATE item cũ
                    ProductItem item = existingMap.get(dto.getItemId());
                    if (item == null) {
                        // itemId không tồn tại -> lỗi
                        throw new RuntimeException("Invalid itemId: " + dto.getItemId());
                    }
                    item.setColor(dto.getColor());
                    item.setPrice(dto.getPrice());
                    productItemRepository.save(item);
                    if (dto.getStockQuantity() != null) {
                        inventoryService.updateStock(item.getItemId(), dto.getStockQuantity());
                    }
                } else {
                    // Thêm item mới
                    ProductItem newItem = ProductItem.builder()
                            .product(product)
                            .color(dto.getColor())
                            .price(dto.getPrice())
                            .build();
                    ProductItem savedItem = productItemRepository.save(newItem);
                    int stockQty = dto.getStockQuantity() != null ? dto.getStockQuantity() : 0;
                    inventoryService.initInventoryForItem(savedItem, stockQty);
                }
            }
        }

        // Xử lý xóa: những item cũ không có trong incomingIds
        // Chỉ xóa khi item không còn tham chiếu (cartItems và orderItems rỗng)
        List<ProductItem> toCheckForDelete = existingItems.stream()
                .filter(i -> i.getItemId() != null && !incomingIds.contains(i.getItemId()))
                .collect(Collectors.toList());

        for (ProductItem oldItem : toCheckForDelete) {
            boolean hasCart = oldItem.getCartItems() != null && !oldItem.getCartItems().isEmpty();
            boolean hasOrder = oldItem.getOrderItems() != null && !oldItem.getOrderItems().isEmpty();

            if (!hasCart && !hasOrder) {
                // an toàn để xóa
                try {
                    productItemRepository.delete(oldItem);
                } catch (Exception ex) {
                    // Nếu có lỗi bất thường, log và tiếp tục (không block toàn bộ update)
                    System.err.println("Failed to delete item " + oldItem.getItemId() + ": " + ex.getMessage());
                }
            } else {
                // Không xóa được — giữ item, và (tuỳ nghiệp vụ) bạn có thể:
                // - giữ nguyên (đã làm)
                // - hoặc đánh dấu inactive (bổ sung trường) => tuỳ nhu cầu
                System.out
                        .println("Skip delete item " + oldItem.getItemId() + " because it's referenced by cart/order");
            }
        }

        cacheInvalidationService.evictProductCaches();
        return getProductDetail(id);
    }

    @Override
    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        Set<String> imageUrls = new HashSet<>();

        if (product.getAvatar() != null && !product.getAvatar().isBlank()) {
            imageUrls.add(product.getAvatar());
        }

        if (product.getImages() != null) {
            imageUrls.addAll(product.getImages());
        }

        for (String imageUrl : imageUrls) {
            try {
                fileUploadService.deleteImage(imageUrl);
            } catch (Exception e) {
                System.err.println("Failed to delete image: " + imageUrl + " - " + e.getMessage());
            }
        }

        productRepository.deleteById(id);
        cacheInvalidationService.evictProductCaches();
    }

    @Override
    @Transactional
    public String uploadProductImage(Long id, MultipartFile image) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        String imageUrl = fileUploadService.uploadImage(image, "products/" + id);

        if (product.getImages() == null) {
            product.setImages(new ArrayList<>());
        }
        product.getImages().add(imageUrl);

        // Set avatar nếu chưa có
        if (product.getAvatar() == null || product.getAvatar().isEmpty()) {
            product.setAvatar(imageUrl);
        }

        productRepository.save(product);
        cacheInvalidationService.evictProductCaches();
        return imageUrl;
    }

    @Override
    @Transactional
    public void deleteProductImage(Long id, String imageUrl) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (product.getImages() != null) {
            product.getImages().remove(imageUrl);

            // Nếu xóa avatar, set avatar mới
            if (imageUrl.equals(product.getAvatar())) {
                product.setAvatar(product.getImages().isEmpty() ? null : product.getImages().get(0));
            }

            productRepository.save(product);
        }

        fileUploadService.deleteImage(imageUrl);
        cacheInvalidationService.evictProductCaches();
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(
            cacheNames = RedisKeyConstants.Cache.PRODUCT_LIST,
            key = "T(iuh.fit.se.backend.constants.RedisKeyConstants).productCategoryKey(#categoryId)",
            unless = "#result == null")
    public List<ProductListDto> getProductsByCategory(Long categoryId) {
        return productRepository.findByCategoryId(categoryId).stream()
                .map(this::convertToListDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(cacheNames = RedisKeyConstants.Cache.PRODUCT_DETAIL, key = "#id", unless = "#result == null")
    public ProductDetailDto getProductDetail(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        List<ProductItemDto> items = productItemRepository.findByProductId(id).stream()
                .map(item -> {
                    int available = inventoryRepository.findByProductItemItemId(item.getItemId())
                            .map(inv -> inv.getAvailableQuantity())
                            .orElse(0);
                    return new ProductItemDto(
                            item.getItemId(),
                            item.getColor(),
                            item.getPrice(),
                            available);
                })
                .collect(Collectors.toList());

        return new ProductDetailDto(
                product.getProductId(),
                product.getName(),
                product.getDescription(),
                product.getBasePrice(),
                product.getAvatar(),
                product.getImages() != null ? product.getImages() : new ArrayList<>(),
                product.getCategory().getCategoryId(),
                product.getCategory().getName(),
                items,
                product.getShowHomepage());
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(
            cacheNames = RedisKeyConstants.Cache.PRODUCT_LIST,
            key = "T(iuh.fit.se.backend.constants.RedisKeyConstants).productSearchKey(#keyword)",
            unless = "#result == null")
    public List<ProductListDto> searchProducts(String keyword) {
        return productRepository.search(keyword).stream()
                .map(this::convertToListDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(
            cacheNames = RedisKeyConstants.Cache.PRODUCT_LIST,
            key = "T(iuh.fit.se.backend.constants.RedisKeyConstants).productFilterKey(#keyword, #categoryId, #minPrice, #maxPrice, #color, #size, #page, #pageSize)",
            unless = "#result == null")
    public List<ProductListDto> filterProducts(
            String keyword,
            Long categoryId,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String color,
            String size,
            Integer page,
            Integer pageSize) {

        List<ProductListDto> products = productRepository
                .searchAdvanced(keyword, categoryId, color, minPrice, maxPrice)
                .stream()
                .map(this::convertToListDto)
                .distinct()
                .collect(Collectors.toList());

        int safePage = page != null && page > 0 ? page - 1 : 0;
        int safePageSize = pageSize != null && pageSize > 0 ? pageSize : products.size();
        int from = Math.min(safePage * safePageSize, products.size());
        int to = Math.min(from + safePageSize, products.size());
        return products.subList(from, to);
    }

    private ProductListDto convertToListDto(Product p) {
        return new ProductListDto(
                p.getProductId(),
                p.getName(),
                p.getAvatar(),
                p.getBasePrice(),
                p.getCategory().getName(),
                p.getShowHomepage() != null ? p.getShowHomepage() : false);
    }
}
