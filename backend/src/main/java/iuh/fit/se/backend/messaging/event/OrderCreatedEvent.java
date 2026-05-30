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
public class OrderCreatedEvent implements Serializable {
    private String eventId;
    private Long orderId;
    private Long userId;
    private String email;
    private LocalDateTime createdAt;
    private String customerName;
    private BigDecimal totalAmount;
    private BigDecimal shippingFee;
    private String paymentMethod;
    private LocalDateTime orderDate;
    private String receiverName;
    private String receiverPhone;
    private String fullAddress;
    private List<ItemLine> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ItemLine implements Serializable {
        private Long itemId;
        private String name;
        private String color;
        private Integer quantity;
        private BigDecimal unitPrice;
    }
}
