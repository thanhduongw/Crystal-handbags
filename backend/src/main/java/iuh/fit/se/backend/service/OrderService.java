package iuh.fit.se.backend.service;

import iuh.fit.se.backend.dto.OrderDetailDto;
import iuh.fit.se.backend.dto.OrderListDto;
import iuh.fit.se.backend.model.OrderStatus;

import java.util.List;

public interface OrderService {
    List<OrderListDto> getAllOrders();
    List<OrderListDto> getUserOrdersByStatus(String email, OrderStatus status);
    OrderDetailDto getOrderDetail(Long orderId);
    void cancelOrder(Long orderId);
    OrderDetailDto createOrder(String email, Long addressId);
    List<OrderListDto> getUserOrders(String email);
    OrderDetailDto adminUpdateOrder(Long orderId, OrderStatus status);
}
