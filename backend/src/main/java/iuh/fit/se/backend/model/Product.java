package iuh.fit.se.backend.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
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
    @Builder.Default
    private List<String> images = new ArrayList<>();

    @ManyToOne
    @JoinColumn(name = "category_id")
    private Category category;

    private LocalDateTime createdAt;

    private Boolean showHomepage;

    @Builder.Default
    private Boolean deleted = false;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        if (images == null) images = new ArrayList<>();
        if (items == null) items = new ArrayList<>();
        if (deleted == null) deleted = false;
    }

    @JsonManagedReference
    @OneToMany(
            mappedBy = "product",
            fetch = FetchType.LAZY,
            cascade = CascadeType.ALL,
            orphanRemoval = false // ✅ FK SAFE
    )
    @Builder.Default
    private List<ProductItem> items = new ArrayList<>();
}
