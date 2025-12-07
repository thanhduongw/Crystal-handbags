package iuh.fit.se.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductListDto {
    private Long productId;
    private String name;
    private String avatar;
    private BigDecimal basePrice;
    private String categoryName;
    private Boolean showHomepage;
}
