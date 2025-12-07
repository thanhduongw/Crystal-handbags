package iuh.fit.se.backend.service.impl;

import iuh.fit.se.backend.dto.*;
import iuh.fit.se.backend.model.*;
import iuh.fit.se.backend.repository.*;
import iuh.fit.se.backend.service.DatabaseCartService;
import iuh.fit.se.backend.service.EmailService;
import iuh.fit.se.backend.service.OrderService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final ProductItemRepository productItemRepository;
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
                .orElseThrow(() -> new EntityNotFoundException("Order not found: " + orderId));

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
                .orElseThrow(() -> new EntityNotFoundException("Order not found: " + orderId));

        if (order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.CONFIRMED) {
            throw new IllegalStateException("Only PENDING or CONFIRMED orders can be cancelled");
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

        // Initialize order with empty list of order items
        Order order = Order.builder()
                .user(user)
                .address(address)
                .orderDate(LocalDateTime.now())
                .status(OrderStatus.PENDING)
                .shippingFee(new BigDecimal("15000"))
                .orderItems(new ArrayList<>()) // Initialize empty list
                .build();

        // Calculate total and create order items
        BigDecimal totalAmount = BigDecimal.ZERO;
        for (CartItemDto cartItem : cartItems) {
            ProductItem productItem = productItemRepository.findById(cartItem.getItemId())
                    .orElseThrow(() -> new RuntimeException("Product item not found: " + cartItem.getItemId()));

            // Check stock availability
            if (productItem.getStockQuantity() < cartItem.getQuantity()) {
                throw new RuntimeException("Insufficient stock for product: " + productItem.getProduct().getName());
            }

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .productItem(productItem)
                    .quantity(cartItem.getQuantity())
                    .price(cartItem.getPrice())
                    .build();

            order.getOrderItems().add(orderItem);

            // Update stock
            productItem.setStockQuantity(productItem.getStockQuantity() - cartItem.getQuantity());
            productItemRepository.save(productItem);

            totalAmount = totalAmount.add(cartItem.getPrice().multiply(new BigDecimal(cartItem.getQuantity())));
        }

        order.setTotalAmount(totalAmount.add(order.getShippingFee()));
        Order savedOrder = orderRepository.save(order);

        // Create payment record
        Payment payment = Payment.builder()
                .order(savedOrder)
                .amount(savedOrder.getTotalAmount())
                .paymentDate(LocalDateTime.now())
                .paymentMethod(PaymentMethod.CASH) // Default payment method
                .status(false) // Unpaid
                .build();
        paymentRepository.save(payment);

        // Clear cart
        cartService.clearCart(email);

        // Send confirmation email
        try {
            emailService.sendOrderConfirmationEmail(email, savedOrder.getOrderId());
        } catch (Exception e) {
            // Log error but don't fail the order creation
            System.err.println("Failed to send order confirmation email: " + e.getMessage());
        }

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

        // Validate status transition
        validateStatusTransition(order.getStatus(), status);

        order.setStatus(status);

        // If order is delivered, mark payment as completed
        if (status == OrderStatus.DELIVERED && order.getPayment() != null) {
            order.getPayment().setStatus(true);
            paymentRepository.save(order.getPayment());
        }

        orderRepository.save(order);

        return getOrderDetail(orderId);
    }

    private void validateStatusTransition(OrderStatus currentStatus, OrderStatus newStatus) {
        // Define valid transitions
        if (currentStatus == OrderStatus.CANCELLED) {
            throw new IllegalStateException("Cannot change status of cancelled order");
        }

        if (currentStatus == OrderStatus.DELIVERED) {
            throw new IllegalStateException("Cannot change status of delivered order");
        }

        // Add more validation rules as needed
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