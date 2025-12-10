package iuh.fit.se.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductDetailDto {
    private Long productId;
    private String name;
    private String description;
    private BigDecimal basePrice;
    private String avatar;
    private List<String> images;
    private Long categoryId;
    private String categoryName;
    private List<ProductItemDto> items;
    private Boolean showHomePage;
}