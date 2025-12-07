package iuh.fit.se.backend.service.impl;

import iuh.fit.se.backend.dto.ProductDetailDto;
import iuh.fit.se.backend.dto.ProductItemDto;
import iuh.fit.se.backend.dto.ProductListDto;
import iuh.fit.se.backend.model.*;
import iuh.fit.se.backend.repository.CategoryRepository;
import iuh.fit.se.backend.repository.ProductItemRepository;
import iuh.fit.se.backend.repository.ProductRepository;
import iuh.fit.se.backend.service.FileUploadService;
import iuh.fit.se.backend.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.util.ArrayList;
import java.util.List;
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
        Category category = categoryRepository.findById(Long.parseLong(productDto.getCategoryName()))
                .orElseThrow(() -> new RuntimeException("Category not found"));

        Product product = Product.builder()
                .name(productDto.getName())
                .description(productDto.getDescription())
                .basePrice(productDto.getBasePrice())
                .avatar(productDto.getAvatar())
                .images(productDto.getImages())
                .category(category)
                .showHomepage(productDto.getShowHomePage())
                .build();

        Product savedProduct = productRepository.save(product);
        return getProductDetail(savedProduct.getProductId());
    }

    @Override
    @Transactional
    public ProductDetailDto updateProduct(Long id, ProductDetailDto productDto) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        Category category = categoryRepository.findById(Long.parseLong(productDto.getCategoryName()))
                .orElseThrow(() -> new RuntimeException("Category not found"));

        product.setName(productDto.getName());
        product.setDescription(productDto.getDescription());
        product.setBasePrice(productDto.getBasePrice());
        product.setAvatar(productDto.getAvatar());
        product.setImages(productDto.getImages());
        product.setCategory(category);
        product.setShowHomepage(productDto.getShowHomePage());

        productRepository.save(product);
        return getProductDetail(id);
    }

    @Override
    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void uploadProductImage(Long id, MultipartFile image) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        String imageUrl = fileUploadService.uploadImage(image, "products/" + id);
        if (product.getImages() == null) {
            product.setImages(new ArrayList<>());
        }
        product.getImages().add(imageUrl);
        productRepository.save(product);
    }

    @Override
    @Transactional
    public void deleteProductImage(Long id, String imageUrl) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        product.getImages().remove(imageUrl);
        productRepository.save(product);
        fileUploadService.deleteImage(imageUrl);
    }

    // ... keep other methods as they are

    @Override
    public List<ProductListDto> getProductsByCategory(Long categoryId) {
        return productRepository.findByCategoryId(categoryId).stream()
                .map(this::convertToListDto)
                .collect(Collectors.toList());
    }

    @Override
    public ProductDetailDto getProductDetail(Long id) {
        Product product = productRepository.findById(id).orElse(null);
        if (product == null) return null;

        List<ProductItemDto> items = productItemRepository.findByProductId(id).stream()
                .map(item -> new ProductItemDto(
                        item.getItemId(),
                        item.getColor(),
                        item.getSize(),
                        item.getPrice(),
                        item.getStockQuantity()))
                .collect(Collectors.toList());

        return new ProductDetailDto(
                product.getProductId(),
                product.getName(),
                product.getDescription(),
                product.getBasePrice(),
                product.getAvatar(),
                product.getImages(),
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
                p.getShowHomepage()
        );
    }
}