package iuh.fit.se.backend.dto;

import iuh.fit.se.backend.model.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderListDto {
    private Long orderId;
    private LocalDateTime orderDate;
    private OrderStatus status;
    private BigDecimal totalAmount;
    private BigDecimal shippingFee;
    private Long userId;
    private String customerName;
    private String customerEmail;
    private String receiver;
    private String paymentMethod;
    private String paymentStatus;
    private int itemCount;
}
