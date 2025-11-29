package iuh.fit.se.backend.dto;

import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CartLineDto implements Serializable {
    private Long itemId;
    private String name;
    private String avatar;
    private BigDecimal price;
    private int qty;
}
