package iuh.fit.se.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductItemDto {
    private Long itemId;
    private String color;
    private BigDecimal price;
    private Integer stockQuantity;
}
