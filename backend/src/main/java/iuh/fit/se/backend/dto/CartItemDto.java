package iuh.fit.se.backend.dto;

import lombok.*;
import java.io.Serializable;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItemDto implements Serializable {
    private Long itemId;
    private String productName;
    private String avatar;
    private String color;
    private String size;
    private BigDecimal price;
    private Integer quantity;
}