package iuh.fit.se.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "product")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long productId;

    private String name;
    private String description;
    private BigDecimal basePrice;
    private String avatar;

    @ElementCollection
    private List<String> images;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;

    private LocalDateTime createdAt;
    private Boolean showHomepage;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL)
    private List<ProductItem> items;
}
