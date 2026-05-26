package iuh.fit.se.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "inventory")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Inventory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long inventoryId;

    @OneToOne
    @JoinColumn(name = "item_id", unique = true)
    @JsonIgnore
    private ProductItem productItem;

    private Integer stockQuantity;
    private Integer reservedQuantity;
    private Integer soldQuantity;

    private LocalDateTime updatedAt;

    public int getAvailableQuantity() {
        int stock = stockQuantity != null ? stockQuantity : 0;
        int reserved = reservedQuantity != null ? reservedQuantity : 0;
        return stock - reserved;
    }

    @PrePersist
    @PreUpdate
    public void updateTimestamp() {
        updatedAt = LocalDateTime.now();
    }
}
