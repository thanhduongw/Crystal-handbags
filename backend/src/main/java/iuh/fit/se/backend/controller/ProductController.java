package iuh.fit.se.backend.controller;

import iuh.fit.se.backend.dto.ProductDetailDto;
import iuh.fit.se.backend.dto.ProductListDto;
import iuh.fit.se.backend.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping("/products")
    public ResponseEntity<List<ProductListDto>> getAll() {
        return ResponseEntity.ok(productService.getAll());
    }

    @GetMapping("/categories/{id}/products")
    public ResponseEntity<List<ProductListDto>> getByCategory(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getByCategory(id));
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<ProductDetailDto> getDetail(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getDetail(id));
    }

    @GetMapping("/products/search")
    public ResponseEntity<List<ProductListDto>> search(@RequestParam String keyword) {
        return ResponseEntity.ok(productService.search(keyword));
    }
}
