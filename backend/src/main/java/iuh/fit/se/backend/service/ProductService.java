package iuh.fit.se.backend.service;

import iuh.fit.se.backend.dto.ProductDetailDto;
import iuh.fit.se.backend.dto.ProductListDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ProductService {
    List<ProductListDto> getAllProducts();
    List<ProductListDto> getProductsByCategory(Long categoryId);
    ProductDetailDto getProductDetail(Long id);
    List<ProductListDto> searchProducts(String keyword);
    ProductDetailDto createProduct(ProductDetailDto productDto);
    ProductDetailDto updateProduct(Long id, ProductDetailDto productDto);
    void deleteProduct(Long id);
    void uploadProductImage(Long id, MultipartFile image);
    void deleteProductImage(Long id, String imageUrl);
}
