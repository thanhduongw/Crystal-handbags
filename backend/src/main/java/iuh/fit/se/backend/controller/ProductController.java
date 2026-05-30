package iuh.fit.se.backend.controller;

import iuh.fit.se.backend.dto.ProductDetailDto;
import iuh.fit.se.backend.dto.ProductListDto;
import iuh.fit.se.backend.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProductController {

        private final ProductService productService;

        @GetMapping("/products")
        public ResponseEntity<List<ProductListDto>> getAllProducts() {
                return ResponseEntity.ok(productService.getAllProducts());
        }

        @GetMapping("/products/{id}")
        public ResponseEntity<ProductDetailDto> getProductById(
                        @PathVariable Long id) {
                return ResponseEntity.ok(productService.getProductDetail(id));
        }

        @GetMapping("/categories/{id}/products")
        public ResponseEntity<List<ProductListDto>> getProductsByCategory(
                        @PathVariable Long id) {
                return ResponseEntity.ok(productService.getProductsByCategory(id));
        }

        @GetMapping("/products/search")
        public ResponseEntity<List<ProductListDto>> searchProducts(
                        @RequestParam String keyword) {
                return ResponseEntity.ok(productService.searchProducts(keyword));
        }

        @GetMapping("/products/filter")
        public ResponseEntity<List<ProductListDto>> filterProducts(
                        @RequestParam(required = false) String keyword,
                        @RequestParam(required = false) Long categoryId,
                        @RequestParam(required = false) BigDecimal minPrice,
                        @RequestParam(required = false) BigDecimal maxPrice,
                        @RequestParam(required = false) String color,
                        @RequestParam(required = false) String size,
                        @RequestParam(required = false) Integer page,
                        @RequestParam(required = false) Integer pageSize) {
                return ResponseEntity.ok(productService.filterProducts(
                                keyword,
                                categoryId,
                                minPrice,
                                maxPrice,
                                color,
                                size,
                                page,
                                pageSize));
        }

        @PostMapping("/products")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<ProductDetailDto> createProduct(
                        @RequestBody ProductDetailDto productDto) {
                ProductDetailDto created = productService.createProduct(productDto);
                return ResponseEntity
                                .status(HttpStatus.CREATED)
                                .body(created);
        }

        @PutMapping("/products/{id}")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<ProductDetailDto> updateProduct(
                        @PathVariable Long id,
                        @RequestBody ProductDetailDto productDto) {
                return ResponseEntity.ok(
                                productService.updateProduct(id, productDto));
        }

        @DeleteMapping("/products/{id}")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<Void> deleteProduct(
                        @PathVariable Long id) {
                productService.deleteProduct(id);
                return ResponseEntity.noContent().build(); // ✅ 204
        }

        @PostMapping("/products/{id}/images")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<String> uploadProductImage(
                        @PathVariable Long id,
                        @RequestParam("image") MultipartFile image) {
                return ResponseEntity.ok(
                                productService.uploadProductImage(id, image));
        }

        @DeleteMapping("/products/{id}/images")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<Void> deleteProductImage(
                        @PathVariable Long id,
                        @RequestParam String imageUrl) {
                productService.deleteProductImage(id, imageUrl);
                return ResponseEntity.noContent().build();
        }
}
