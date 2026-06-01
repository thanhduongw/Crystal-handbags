package iuh.fit.se.backend.service.impl;

import iuh.fit.se.backend.messaging.publisher.MessagePublisher;
import iuh.fit.se.backend.model.Address;
import iuh.fit.se.backend.model.Order;
import iuh.fit.se.backend.model.OrderItem;
import iuh.fit.se.backend.model.OrderStatus;
import iuh.fit.se.backend.model.Product;
import iuh.fit.se.backend.model.ProductItem;
import iuh.fit.se.backend.model.User;
import iuh.fit.se.backend.repository.AddressRepository;
import iuh.fit.se.backend.repository.OrderRepository;
import iuh.fit.se.backend.repository.PaymentRepository;
import iuh.fit.se.backend.repository.ProductItemRepository;
import iuh.fit.se.backend.repository.UserRepository;
import iuh.fit.se.backend.service.CartService;
import iuh.fit.se.backend.service.InventoryLockService;
import iuh.fit.se.backend.service.InventoryService;
import iuh.fit.se.backend.service.VNPayService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceImplTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AddressRepository addressRepository;

    @Mock
    private ProductItemRepository productItemRepository;

    @Mock
    private CartService cartService;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private VNPayService vnPayService;

    @Mock
    private InventoryService inventoryService;

    @Mock
    private InventoryLockService inventoryLockService;

    @Mock
    private MessagePublisher messagePublisher;

    @InjectMocks
    private OrderServiceImpl orderService;

    @Test
    void cancelOrderRestoresInventoryBeforeMarkingCancelled() {
        Order order = buildOrder(OrderStatus.PENDING, 2);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        orderService.cancelOrder(1L);

        verify(inventoryService).increaseStock(99L, 2);
        verify(orderRepository).save(order);
    }

    @Test
    void adminCancellingOrderRestoresInventory() {
        Order order = buildOrder(OrderStatus.CONFIRMED, 3);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order), Optional.of(order));

        orderService.adminUpdateOrder(1L, OrderStatus.CANCELLED);

        verify(inventoryService).increaseStock(99L, 3);
        verify(orderRepository).save(order);
    }

    private Order buildOrder(OrderStatus status, int quantity) {
        User user = User.builder()
                .userId(10L)
                .email("customer@example.com")
                .firstName("Nguyen")
                .lastName("An")
                .build();
        Address address = Address.builder()
                .fullName("Nguyen An")
                .street("1 Nguyen Trai")
                .ward("Phuong 1")
                .district("Quan 1")
                .province("TP HCM")
                .build();
        Product product = Product.builder()
                .productId(20L)
                .name("Tui xach")
                .avatar("avatar.jpg")
                .build();
        ProductItem productItem = ProductItem.builder()
                .itemId(99L)
                .product(product)
                .color("Den")
                .price(BigDecimal.valueOf(100000))
                .build();
        Order order = Order.builder()
                .orderId(1L)
                .user(user)
                .address(address)
                .orderDate(LocalDateTime.now())
                .status(status)
                .shippingFee(BigDecimal.valueOf(15000))
                .totalAmount(BigDecimal.valueOf(215000))
                .build();
        OrderItem orderItem = OrderItem.builder()
                .order(order)
                .productItem(productItem)
                .quantity(quantity)
                .price(BigDecimal.valueOf(100000))
                .build();
        order.setOrderItems(List.of(orderItem));
        return order;
    }
}
