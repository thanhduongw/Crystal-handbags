package iuh.fit.se.backend.service.impl;

import iuh.fit.se.backend.dto.OrderDetailDto;
import iuh.fit.se.backend.dto.OrderItemDto;
import iuh.fit.se.backend.dto.OrderListDto;
import iuh.fit.se.backend.model.Order;
import iuh.fit.se.backend.model.OrderItem;
import iuh.fit.se.backend.model.OrderStatus;
import iuh.fit.se.backend.repository.OrderRepository;
import iuh.fit.se.backend.service.OrderService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;

    /* ======================= LIST ======================= */

    @Override
    public List<OrderListDto> getAll() {
        return orderRepository.findAll()
                .stream()
                .map(this::toListDto)
                .toList();
    }

    @Override
    public List<OrderListDto> getByStatus(OrderStatus status) {
        return orderRepository.findByStatus(status)
                .stream()
                .map(this::toListDto)
                .toList();
    }

    /* ======================= DETAIL ======================= */

    @Override
    public OrderDetailDto getDetail(Long orderId) {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() ->
                        new EntityNotFoundException("Order not found: " + orderId));

        List<OrderItemDto> items = order.getOrderItems()
                .stream()
                .map(this::toItemDto)
                .toList();

        return new OrderDetailDto(
                order.getOrderId(),
                order.getOrderDate(),
                order.getStatus(),
                order.getTotalAmount(),
                order.getShippingFee(),
                order.getAddress() != null ? order.getAddress().getFullName() : "",
                buildFullAddress(order),
                items
        );
    }

    @Override
    public void cancelOrder(Long orderId) {

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() ->
                        new EntityNotFoundException("Order not found: " + orderId));

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new IllegalStateException("Only PENDING orders can be cancelled");
        }

        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);
    }


    /* ======================= MAPPER ======================= */

    private OrderListDto toListDto(Order o) {
        return new OrderListDto(
                o.getOrderId(),
                o.getOrderDate(),
                o.getStatus(),
                o.getTotalAmount()
        );
    }

    private OrderItemDto toItemDto(OrderItem oi) {
        return new OrderItemDto(
                oi.getProductItem().getItemId(),
                oi.getProductItem().getProduct().getName(),
                oi.getProductItem().getColor(),
                oi.getProductItem().getSize(),
                oi.getQuantity(),
                oi.getPrice()
        );
    }

    private String buildFullAddress(Order order) {
        if (order.getAddress() == null) return "";
        return String.join(", ",
                order.getAddress().getStreet(),
                order.getAddress().getWard(),
                order.getAddress().getDistrict(),
                order.getAddress().getProvince()
        );
    }
}
