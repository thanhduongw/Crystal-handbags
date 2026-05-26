package iuh.fit.se.backend.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderConfirmationEmailData {
    private String customerName;
    private String customerEmail;
    private Long orderId;
    private LocalDateTime orderDate;
    private String paymentMethod;
    private List<ItemLine> items;
    private BigDecimal subtotal;
    private BigDecimal shippingFee;
    private BigDecimal totalAmount;
    private String receiverName;
    private String receiverPhone;
    private String fullAddress;
    private String frontendUrl;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ItemLine {
        private String name;
        private String color;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal lineTotal;
    }
}
