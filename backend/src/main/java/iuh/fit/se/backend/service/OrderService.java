package iuh.fit.se.backend.service;

import iuh.fit.se.backend.dto.OrderDetailDto;
import iuh.fit.se.backend.dto.OrderListDto;
import iuh.fit.se.backend.model.OrderStatus;

import java.util.List;

public interface OrderService {

    List<OrderListDto> getAll();

    List<OrderListDto> getByStatus(OrderStatus status);

    OrderDetailDto getDetail(Long orderId);
    void cancelOrder(Long orderId);
}
