package iuh.fit.se.backend.dto;

import java.math.BigDecimal;

public record OrderItemDto(Long itemId,
                           String productName,
                           String color,
                           String size,
                           int quantity,
                           BigDecimal price) {
}
