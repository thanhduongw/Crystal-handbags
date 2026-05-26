package iuh.fit.se.backend.messaging.consumer;

import iuh.fit.se.backend.dto.OrderConfirmationEmailData;
import iuh.fit.se.backend.messaging.OrderCreatedMessage;
import iuh.fit.se.backend.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderCreatedConsumer {

    private final EmailService emailService;

    @Value("${app.frontend.url:}")
    private String frontendUrl;

    @RabbitListener(queues = "${app.rabbitmq.queue.order-created}")
    public void handleOrderCreated(OrderCreatedMessage message) {
        try {
            List<OrderConfirmationEmailData.ItemLine> items = message.getItems().stream()
                    .map(item -> OrderConfirmationEmailData.ItemLine.builder()
                            .name(item.getName())
                            .color(item.getColor())
                            .quantity(item.getQuantity())
                            .unitPrice(item.getUnitPrice())
                            .lineTotal(item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                            .build())
                    .toList();

            BigDecimal subtotal = items.stream()
                    .map(OrderConfirmationEmailData.ItemLine::getLineTotal)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            OrderConfirmationEmailData data = OrderConfirmationEmailData.builder()
                    .customerName(message.getCustomerName())
                    .customerEmail(message.getCustomerEmail())
                    .orderId(message.getOrderId())
                    .orderDate(message.getOrderDate())
                    .paymentMethod(message.getPaymentMethod())
                    .items(items)
                    .subtotal(subtotal)
                    .shippingFee(message.getShippingFee())
                    .totalAmount(message.getTotalAmount())
                    .receiverName(message.getReceiverName())
                    .receiverPhone(message.getReceiverPhone())
                    .fullAddress(message.getFullAddress())
                    .frontendUrl(frontendUrl)
                    .build();

            emailService.sendOrderConfirmation(data);
        } catch (Exception ex) {
            log.error("Failed to process order created message", ex);
            throw ex;
        }
    }
}
