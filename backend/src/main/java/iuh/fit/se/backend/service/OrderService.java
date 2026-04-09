package iuh.fit.se.backend.service;

import iuh.fit.se.backend.dto.CheckoutRequest;
import iuh.fit.se.backend.dto.CheckoutResponse;
import iuh.fit.se.backend.dto.OrderDetailDto;
import iuh.fit.se.backend.dto.OrderListDto;
import iuh.fit.se.backend.model.OrderStatus;

import java.util.List;

public interface OrderService {
    List<OrderListDto> getAllOrders();
    List<OrderListDto> getUserOrdersByStatus(String email, OrderStatus status);
    OrderDetailDto getOrderDetail(Long orderId);
    void cancelOrder(Long orderId);
    OrderDetailDto adminGetOrderDetail(Long id);
    CheckoutResponse createOrder(String email, CheckoutRequest request, String clientIp);
    List<OrderListDto> getUserOrders(String email);
    OrderDetailDto adminUpdateOrder(Long orderId, OrderStatus status);
}
