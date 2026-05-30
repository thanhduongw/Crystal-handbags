package iuh.fit.se.backend.messaging.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderCancelledEvent implements Serializable {
    private String eventId;
    private Long orderId;
    private Long userId;
    private String email;
    private LocalDateTime createdAt;
    private String customerName;
    private BigDecimal totalAmount;
    private String reason;
    private List<InventoryLine> inventoryItems;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InventoryLine implements Serializable {
        private Long itemId;
        private Integer quantity;
    }
}
