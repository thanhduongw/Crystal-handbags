package iuh.fit.se.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemDto {
    private Long itemId;
    private Long productId;
    private String productName;
    private String color;
    private int quantity;
    private BigDecimal price;
    private String avatar;
}

