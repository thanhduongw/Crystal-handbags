package iuh.fit.se.backend.dto;

import java.math.BigDecimal;
import java.util.List;

public record ProductDetailDto(
    Long productId,
    String name,
    String description,
    BigDecimal basePrice,
    String avatar,
    List<String> images,
    String categoryName,
    List<ProductItemDto> items
) {}
