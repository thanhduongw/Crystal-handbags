package iuh.fit.se.backend.dto;

import iuh.fit.se.backend.model.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record OrderListDto(Long orderId,
                           LocalDateTime orderDate,
                           OrderStatus status,
                           BigDecimal totalAmount) {
}
