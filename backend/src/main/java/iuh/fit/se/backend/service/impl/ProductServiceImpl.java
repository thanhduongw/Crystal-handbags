package iuh.fit.se.backend.service.impl;

import iuh.fit.se.backend.dto.ProductDetailDto;
import iuh.fit.se.backend.dto.ProductItemDto;
import iuh.fit.se.backend.dto.ProductListDto;
import iuh.fit.se.backend.model.Product;
import iuh.fit.se.backend.repository.ProductItemRepository;
import iuh.fit.se.backend.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements iuh.fit.se.backend.service.ProductService {
    private final ProductRepository productRepository;
    private final ProductItemRepository productItemRepository;

    @Override
    public List<ProductListDto> getAll() {
        return productRepository.findAll()
                .stream()
                .map(p -> new ProductListDto(
                        p.getProductId(),
                        p.getName(),
                        p.getAvatar(),
                        p.getBasePrice(),
                        p.getCategory().getName(),
                        p.getShowHomepage()))
                .collect(Collectors.toList());
    }

    @Override
    public List<ProductListDto> getByCategory(Long categoryId) {
        return productRepository.findByCategoryId(categoryId)
                .stream()
                .map(p -> new ProductListDto(
                        p.getProductId(),
                        p.getName(),
                        p.getAvatar(),
                        p.getBasePrice(),
                        p.getCategory().getName(),
                        p.getShowHomepage()))
                .collect(Collectors.toList());
    }

    @Override
    public ProductDetailDto getDetail(Long id) {
        Product product = productRepository.findById(id).orElse(null);
        if (product == null) {
            return null;
        }
        List<ProductItemDto> items = productItemRepository.findByProductId(id)
                .stream().map(item -> new ProductItemDto(
                        item.getItemId(),
                        item.getColor(),
                        item.getSize(),
                        item.getPrice(),
                        item.getStockQuantity()
                )).collect(Collectors.toList());
        return new ProductDetailDto(
                product.getProductId(),
                product.getName(),
                product.getDescription(),
                product.getBasePrice(),
                product.getAvatar(),
                product.getImages(),
                product.getCategory().getName(),
                items);
    }

    @Override
    public List<ProductListDto> search(String keyword) {
        return productRepository.search(keyword)
                .stream()
                .map(p -> new ProductListDto(
                        p.getProductId(),
                        p.getName(),
                        p.getAvatar(),
                        p.getBasePrice(),
                        p.getCategory().getName(),
                        p.getShowHomepage()))
                .collect(Collectors.toList());
    }

}
