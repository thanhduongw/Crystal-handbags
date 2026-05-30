package iuh.fit.se.backend.service.impl;

import iuh.fit.se.backend.dto.*;
import iuh.fit.se.backend.messaging.EmailNotificationMessage;
import iuh.fit.se.backend.messaging.OrderCreatedMessage;
import iuh.fit.se.backend.messaging.publisher.MessagePublisher;
import iuh.fit.se.backend.model.*;
import iuh.fit.se.backend.repository.*;
import iuh.fit.se.backend.service.CartService;
import iuh.fit.se.backend.service.InventoryLockService;
import iuh.fit.se.backend.service.InventoryService;
import iuh.fit.se.backend.service.OrderService;
import iuh.fit.se.backend.service.VNPayService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderServiceImpl implements OrderService {

    private static final Duration INVENTORY_LOCK_TTL = Duration.ofSeconds(15);

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final ProductItemRepository productItemRepository;
    private final CartService cartService;
    private final PaymentRepository paymentRepository;
    private final VNPayService vnPayService;
    private final InventoryService inventoryService;
    private final InventoryLockService inventoryLockService;
    private final MessagePublisher messagePublisher;

    @Override
    @Transactional(readOnly = true)
    public List<OrderListDto> getAllOrders() {
        return orderRepository.findAll()
                .stream()
                .map(this::toListDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public OrderDetailDto adminGetOrderDetail(Long id) {
        return getOrderDetail(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderListDto> getUserOrdersByStatus(String email, OrderStatus status) {
        return orderRepository.findByUserEmailAndStatus(email, status)
                .stream()
                .map(this::toListDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
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
                order.getAddress() != null ? order.getAddress().getFullName() : null,
                buildFullAddress(order),
                items,
                order.getUser().getUserId());
    }

    @Override
    @Transactional
    public void cancelOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new EntityNotFoundException("Order not found: " + orderId));

        if (order.getStatus() != OrderStatus.PENDING
                && order.getStatus() != OrderStatus.CONFIRMED) {
            throw new IllegalStateException("Only PENDING or CONFIRMED orders can be cancelled");
        }

        for (OrderItem item : order.getOrderItems()) {
            inventoryService.increaseStock(item.getProductItem().getItemId(), item.getQuantity());
        }

        order.setStatus(OrderStatus.CANCELLED);
        orderRepository.save(order);

        messagePublisher.publishOrderCancelled(buildOrderCancelledMessage(order));
    }

    @Override
    @Transactional
    public CheckoutResponse createOrder(String email, CheckoutRequest request, String clientIp) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Address address = addressRepository.findById(request.getAddressId())
                .orElseThrow(() -> new RuntimeException("Address not found"));

        List<CartLineDto> cartItems = cartService.getAllCart(email);
        if (cartItems.isEmpty()) {
            throw new RuntimeException("Cart is empty");
        }

        PaymentMethod paymentMethod = request.getPaymentMethod();
        if (paymentMethod == null) {
            throw new RuntimeException("Payment method is required");
        }

        List<InventoryLockService.LockHandle> locks = acquireInventoryLocks(cartItems);
        try {
            Order order = Order.builder()
                    .user(user)
                    .address(address)
                    .orderDate(LocalDateTime.now())
                    .status(OrderStatus.PENDING)
                    .shippingFee(new BigDecimal("15000"))
                    .orderItems(new ArrayList<>())
                    .build();

            BigDecimal totalAmount = BigDecimal.ZERO;
            for (CartLineDto cartItem : cartItems) {
                ProductItem productItem = productItemRepository.findById(cartItem.getItemId())
                        .orElseThrow(() -> new RuntimeException("Product item not found: " + cartItem.getItemId()));

                if (!inventoryService.checkAvailability(productItem.getItemId(), cartItem.getQty())) {
                    throw new RuntimeException("Insufficient stock for product: " + productItem.getProduct().getName());
                }

                OrderItem orderItem = OrderItem.builder()
                        .order(order)
                        .productItem(productItem)
                        .quantity(cartItem.getQty())
                        .price(cartItem.getPrice())
                        .build();

                order.getOrderItems().add(orderItem);
                inventoryService.decreaseStock(productItem.getItemId(), cartItem.getQty());
                totalAmount = totalAmount.add(cartItem.getPrice().multiply(BigDecimal.valueOf(cartItem.getQty())));
            }

            order.setTotalAmount(totalAmount.add(order.getShippingFee()));
            Order savedOrder = orderRepository.save(order);

            Payment payment = Payment.builder()
                    .order(savedOrder)
                    .amount(savedOrder.getTotalAmount())
                    .paymentMethod(paymentMethod)
                    .status(paymentMethod == PaymentMethod.VNPAY
                            ? PaymentStatus.PENDING_PAYMENT
                            : PaymentStatus.PENDING)
                    .paymentDate(null)
                    .build();

            if (paymentMethod == PaymentMethod.VNPAY) {
                payment.setTxnRef(generateTxnRef(savedOrder));
                payment.setOrderInfo("Thanh toan don hang #" + savedOrder.getOrderId());
            }

            Payment savedPayment = paymentRepository.save(payment);

            String paymentUrl = null;
            if (paymentMethod == PaymentMethod.VNPAY) {
                paymentUrl = vnPayService.createPaymentUrl(savedOrder, savedPayment, clientIp);
            }

            cartService.clearCart(email);
            publishOrderCreatedEvent(savedOrder, paymentMethod);

            return CheckoutResponse.builder()
                    .orderId(savedOrder.getOrderId())
                    .paymentMethod(paymentMethod.name())
                    .paymentStatus(savedPayment.getStatus().name())
                    .orderStatus(savedOrder.getStatus().name())
                    .paymentUrl(paymentUrl)
                    .build();
        } finally {
            releaseLocksAfterTransaction(locks);
        }
    }

    @Override
    @Transactional(readOnly = true)
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

        validateStatusTransition(order.getStatus(), status);

        if (status == OrderStatus.DELIVERED && order.getPayment() != null) {
            if (order.getPayment().getPaymentMethod() == PaymentMethod.VNPAY
                    && order.getPayment().getStatus() != PaymentStatus.SUCCESS) {
                throw new IllegalStateException("VNPAY order has not been paid successfully");
            }
            if (order.getPayment().getPaymentMethod() == PaymentMethod.CASH) {
                order.getPayment().setStatus(PaymentStatus.SUCCESS);
                order.getPayment().setPaymentDate(LocalDateTime.now());
                paymentRepository.save(order.getPayment());
            }
        }
        if (status == OrderStatus.CANCELLED && order.getStatus() != OrderStatus.CANCELLED) {
            for (OrderItem item : order.getOrderItems()) {
                inventoryService.increaseStock(item.getProductItem().getItemId(), item.getQuantity());
            }
            messagePublisher.publishOrderCancelled(buildOrderCancelledMessage(order));
        }

        order.setStatus(status);
        orderRepository.save(order);

        return getOrderDetail(orderId);
    }

    private List<InventoryLockService.LockHandle> acquireInventoryLocks(List<CartLineDto> cartItems) {
        List<InventoryLockService.LockHandle> locks = new ArrayList<>();
        try {
            cartItems.stream()
                    .map(CartLineDto::getItemId)
                    .distinct()
                    .sorted(Comparator.naturalOrder())
                    .forEach(itemId -> locks.add(inventoryLockService.acquireOrThrow(itemId, INVENTORY_LOCK_TTL)));
            return locks;
        } catch (RuntimeException ex) {
            locks.forEach(inventoryLockService::release);
            throw ex;
        }
    }

    private void releaseLocksAfterTransaction(List<InventoryLockService.LockHandle> locks) {
        if (locks == null || locks.isEmpty()) {
            return;
        }

        Runnable release = () -> locks.forEach(inventoryLockService::release);
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCompletion(int status) {
                    release.run();
                }
            });
        } else {
            release.run();
        }
    }

    private void validateStatusTransition(OrderStatus currentStatus, OrderStatus newStatus) {
        if (currentStatus == OrderStatus.CANCELLED) {
            throw new IllegalStateException("Cannot change status of cancelled order");
        }

        if (currentStatus == OrderStatus.DELIVERED) {
            throw new IllegalStateException("Cannot change status of delivered order");
        }
    }

    private OrderListDto toListDto(Order o) {
        return new OrderListDto(
                o.getOrderId(),
                o.getOrderDate(),
                o.getStatus(),
                o.getTotalAmount(),
                o.getShippingFee(),
                o.getUser() != null ? o.getUser().getUserId() : null,
                o.getUser() != null ? buildCustomerName(o.getUser()) : null,
                o.getUser() != null ? o.getUser().getEmail() : null,
                o.getAddress() != null ? o.getAddress().getFullName() : null,
                o.getPayment() != null && o.getPayment().getPaymentMethod() != null
                        ? o.getPayment().getPaymentMethod().name()
                        : null,
                o.getPayment() != null && o.getPayment().getStatus() != null
                        ? o.getPayment().getStatus().name()
                        : null,
                o.getOrderItems() != null
                        ? o.getOrderItems().stream()
                        .mapToInt(item -> item.getQuantity() != null ? item.getQuantity() : 0)
                        .sum()
                        : 0);
    }

    private OrderItemDto toItemDto(OrderItem oi) {
        ProductItem pi = oi.getProductItem();
        Product product = pi.getProduct();

        return new OrderItemDto(
                pi.getItemId(),
                product.getProductId(),
                product.getName(),
                pi.getColor(),
                oi.getQuantity(),
                oi.getPrice(),
                product.getAvatar());
    }

    private String buildFullAddress(Order order) {
        if (order.getAddress() == null) {
            return null;
        }
        return String.join(", ",
                order.getAddress().getStreet(),
                order.getAddress().getWard(),
                order.getAddress().getDistrict(),
                order.getAddress().getProvince());
    }

    private String generateTxnRef(Order order) {
        return "ORD" + order.getOrderId() + System.currentTimeMillis();
    }

    private void publishOrderCreatedEvent(Order order, PaymentMethod paymentMethod) {
        User user = order.getUser();
        Address address = order.getAddress();

        String customerName = buildCustomerName(user);

        List<OrderCreatedMessage.ItemLine> items = order.getOrderItems().stream()
                .map(item -> OrderCreatedMessage.ItemLine.builder()
                        .name(item.getProductItem().getProduct().getName())
                        .color(item.getProductItem().getColor())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getPrice())
                        .build())
                .collect(Collectors.toList());

        OrderCreatedMessage message = OrderCreatedMessage.builder()
                .orderId(order.getOrderId())
                .customerEmail(user.getEmail())
                .customerName(customerName)
                .totalAmount(order.getTotalAmount())
                .shippingFee(order.getShippingFee())
                .paymentMethod(paymentMethod.name())
                .orderDate(order.getOrderDate())
                .receiverName(address != null ? address.getFullName() : null)
                .receiverPhone(address != null ? address.getPhoneNumber() : null)
                .fullAddress(buildFullAddress(order))
                .items(items)
                .build();

        messagePublisher.publishOrderCreated(message);
    }

    private String buildCustomerName(User user) {
        if (user == null) {
            return null;
        }
        String firstName = user.getFirstName() != null ? user.getFirstName() : "";
        String lastName = user.getLastName() != null ? user.getLastName() : "";
        String fullName = (firstName + " " + lastName).trim();
        return fullName.isBlank() ? user.getEmail() : fullName;
    }

    private EmailNotificationMessage buildOrderCancelledMessage(Order order) {
        String email = order.getUser() != null ? order.getUser().getEmail() : null;
        String subject = "Order cancelled #" + order.getOrderId();
        String text = "Your order has been cancelled.";
        return EmailNotificationMessage.builder()
                .to(email)
                .subject(subject)
                .text(text)
                .build();
    }
}
