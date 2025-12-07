package iuh.fit.se.backend.dto;

import iuh.fit.se.backend.model.OrderStatus;
import iuh.fit.se.backend.model.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderDetailDto {
    private Long orderId;
    private LocalDateTime orderDate;
    private OrderStatus status;
    private BigDecimal totalAmount;
    private BigDecimal shippingFee;
    private String receiver;
    private String address;
    private List<OrderItemDto> items;
    private Long userId;
}
