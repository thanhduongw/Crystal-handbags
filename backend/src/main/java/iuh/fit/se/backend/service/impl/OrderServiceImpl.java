package iuh.fit.se.backend.service.impl;

import iuh.fit.se.backend.dto.*;
import iuh.fit.se.backend.model.*;
import iuh.fit.se.backend.repository.*;
import iuh.fit.se.backend.service.DatabaseCartService;
import iuh.fit.se.backend.service.EmailService;
import iuh.fit.se.backend.service.OrderService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final DatabaseCartService cartService;
    private final EmailService emailService;
    private final PaymentRepository paymentRepository;

    @Override
    public List<OrderListDto> getAllOrders() {
        return orderRepository.findAll()
                .stream()
                .map(this::toListDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<OrderListDto> getOrdersByStatus(OrderStatus status) {
        return orderRepository.findByStatus(status)
                .stream()
                .map(this::toListDto)
                .collect(Collectors.toList());
    }

    @Override
    public OrderDetailDto getOrderDetail(Long orderId) {

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
                items,
                order.getUser().getUserId()
        );
    }

    @Override
    @Transactional
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

    @Override
    @Transactional
    public OrderDetailDto createOrder(String email, Long addressId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found"));

        List<CartItemDto> cartItems = cartService.getAllCart(email);
        if (cartItems.isEmpty()) {
            throw new RuntimeException("Cart is empty");
        }

        Order order = Order.builder()
                .user(user)
                .address(address)
                .orderDate(LocalDateTime.now())
                .status(OrderStatus.PENDING)
                .shippingFee(new BigDecimal("15000"))
                .build();

        BigDecimal totalAmount = BigDecimal.ZERO;
        for (CartItemDto cartItem : cartItems) {
            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .productItem(ProductItem.builder().itemId(cartItem.getItemId()).build())
                    .quantity(cartItem.getQuantity())
                    .price(cartItem.getPrice())
                    .build();
            order.getOrderItems().add(orderItem);
            totalAmount = totalAmount.add(cartItem.getPrice().multiply(new BigDecimal(cartItem.getQuantity())));
        }

        order.setTotalAmount(totalAmount.add(order.getShippingFee()));
        Order savedOrder = orderRepository.save(order);

        // Create payment record
        Payment payment = Payment.builder()
                .order(savedOrder)
                .amount(savedOrder.getTotalAmount())
                .paymentDate(LocalDateTime.now())
                .status(false)
                .build();
        paymentRepository.save(payment);

        // Clear cart
        cartService.clearCart(email);

        // Send confirmation email
        emailService.sendOrderConfirmationEmail(email, savedOrder.getOrderId());

        return getOrderDetail(savedOrder.getOrderId());
    }

    @Override
    public List<OrderListDto> getUserOrders(String email) {
        return orderRepository.findByUserEmail(email).stream()
                .map(this::toListDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public OrderDetailDto adminUpdateOrder(Long orderId, OrderStatus status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new EntityNotFoundException("Order not found: " + orderId));

        order.setStatus(status);
        orderRepository.save(order);

        return getOrderDetail(orderId);
    }

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
