package iuh.fit.se.backend.dto;

import iuh.fit.se.backend.model.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderDetailDto(
        Long orderId,
        LocalDateTime orderDate,
        OrderStatus status,
        BigDecimal totalAmount,
        BigDecimal shippingFee,
        String receiver,
        String address,
        List<OrderItemDto> items
) {
}
