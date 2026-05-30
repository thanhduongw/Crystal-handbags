package iuh.fit.se.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RedisCartItemDto implements Serializable {
    private Long productId;
    private Long variantId;
    private String productName;
    private String avatar;
    private String color;
    private Integer quantity;
    private BigDecimal priceSnapshot;
}
