package iuh.fit.se.backend.service;

import iuh.fit.se.backend.dto.ProductDetailDto;
import iuh.fit.se.backend.dto.ProductListDto;

import java.util.List;

public interface ProductService {
    List<ProductListDto> getByCategory(Long categoryId);

    ProductDetailDto getDetail(Long id);

    List<ProductListDto> search(String keyword);
}
