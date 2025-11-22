package iuh.fit.se.backend.dto;

import java.math.BigDecimal;

public record ProductItemDto(
   Long itemId,
   String color,
   String size,
   BigDecimal price,
   Integer stockQuantity
) {}
