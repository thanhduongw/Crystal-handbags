package iuh.fit.se.backend.messaging;

import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderCreatedMessage implements Serializable {
    private Long orderId;
    private String customerEmail;
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
        private String name;
        private String color;
        private Integer quantity;
        private BigDecimal unitPrice;
    }
}
