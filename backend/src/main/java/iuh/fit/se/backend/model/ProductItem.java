package iuh.fit.se.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "product_item")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long itemId;

    @ManyToOne
    @JoinColumn(name = "product_id")
    private Product product;

    private String size;
    private String color;
    private Integer stockQuantity;
    private BigDecimal price;
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "productItem")
    private List<OrderItem> orderItems;

    @OneToMany(mappedBy = "productItem")
    private List<CartItem> cartItems;
}
