package iuh.fit.se.backend.service.impl;

import iuh.fit.se.backend.dto.ProductDetailDto;
import iuh.fit.se.backend.dto.ProductItemDto;
import iuh.fit.se.backend.dto.ProductListDto;
import iuh.fit.se.backend.model.Product;
import iuh.fit.se.backend.model.ProductItem;
import iuh.fit.se.backend.model.Category;
import iuh.fit.se.backend.repository.CategoryRepository;
import iuh.fit.se.backend.repository.ProductItemRepository;
import iuh.fit.se.backend.repository.ProductRepository;
import iuh.fit.se.backend.service.FileUploadService;
import iuh.fit.se.backend.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {
    private final ProductRepository productRepository;
    private final ProductItemRepository productItemRepository;
    private final CategoryRepository categoryRepository;
    private final FileUploadService fileUploadService;

    @Override
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
                        .stockQuantity(itemDto.getStockQuantity())
                        .build();
                productItemRepository.save(item);
            }
        }

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
                    item.setStockQuantity(dto.getStockQuantity());
                    productItemRepository.save(item);
                } else {
                    // Thêm item mới
                    ProductItem newItem = ProductItem.builder()
                            .product(product)
                            .color(dto.getColor())
                            .price(dto.getPrice())
                            .stockQuantity(dto.getStockQuantity())
                            .build();
                    productItemRepository.save(newItem);
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
                System.out.println("Skip delete item " + oldItem.getItemId() + " because it's referenced by cart/order");
            }
        }

        return getProductDetail(id);
    }

    @Override
    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        // Xóa images từ storage
        if (product.getImages() != null) {
            for (String imageUrl : product.getImages()) {
                try {
                    fileUploadService.deleteImage(imageUrl);
                } catch (Exception e) {
                    // Log nhưng không throw để tiếp tục xóa
                    System.err.println("Failed to delete image: " + imageUrl + " - " + e.getMessage());
                }
            }
        }

        productRepository.deleteById(id);
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
    }

    @Override
    public List<ProductListDto> getProductsByCategory(Long categoryId) {
        return productRepository.findByCategoryId(categoryId).stream()
                .map(this::convertToListDto)
                .collect(Collectors.toList());
    }

    @Override
    public ProductDetailDto getProductDetail(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        List<ProductItemDto> items = productItemRepository.findByProductId(id).stream()
                .map(item -> new ProductItemDto(
                        item.getItemId(),
                        item.getColor(),
                        item.getPrice(),
                        item.getStockQuantity()))
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
    public List<ProductListDto> searchProducts(String keyword) {
        return productRepository.search(keyword).stream()
                .map(this::convertToListDto)
                .collect(Collectors.toList());
    }

    private ProductListDto convertToListDto(Product p) {
        return new ProductListDto(
                p.getProductId(),
                p.getName(),
                p.getAvatar(),
                p.getBasePrice(),
                p.getCategory().getName(),
                p.getShowHomepage() != null ? p.getShowHomepage() : false
        );
    }
}
