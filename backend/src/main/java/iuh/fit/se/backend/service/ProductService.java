package iuh.fit.se.backend.service;

import iuh.fit.se.backend.dto.ProductDetailDto;
import iuh.fit.se.backend.dto.ProductListDto;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

public interface ProductService {
    List<ProductListDto> getAllProducts();
    ProductDetailDto getProductDetail(Long id);
    List<ProductListDto> getProductsByCategory(Long categoryId);
    List<ProductListDto> searchProducts(String keyword);
    List<ProductListDto> filterProducts(
            String keyword,
            Long categoryId,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String color,
            String size,
            Integer page,
            Integer pageSize);

    ProductDetailDto createProduct(ProductDetailDto productDto);
    ProductDetailDto updateProduct(Long id, ProductDetailDto productDto);
    void deleteProduct(Long id);

    String uploadProductImage(Long id, MultipartFile image);
    void deleteProductImage(Long id, String imageUrl);
}
