package iuh.fit.se.backend.dto;

import java.math.BigDecimal;

public record ProductListDto(
        Long productId,
        String name,
        String avatar,
        BigDecimal basePrice,
        String categoryName
) {}
