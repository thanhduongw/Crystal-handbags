package iuh.fit.se.backend.messaging.consumer;

import iuh.fit.se.backend.messaging.PaymentResultMessage;
import iuh.fit.se.backend.model.Order;
import iuh.fit.se.backend.model.OrderItem;
import iuh.fit.se.backend.repository.OrderRepository;
import iuh.fit.se.backend.service.EmailService;
import iuh.fit.se.backend.service.InventoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentConsumer {

    private final EmailService emailService;
    private final OrderRepository orderRepository;
    private final InventoryService inventoryService;

    @RabbitListener(queues = "${app.rabbitmq.queue.payment-success}")
    public void handlePaymentSuccess(PaymentResultMessage message) {
        String subject = "Payment successful for order #" + message.getOrderId();
        String text = "Payment succeeded. Order: " + message.getOrderId()
                + "\nAmount: " + message.getAmount()
                + "\nTransaction: " + message.getTxnRef();
        emailService.sendSimpleEmail(message.getCustomerEmail(), subject, text);
    }

    @RabbitListener(queues = "${app.rabbitmq.queue.payment-failed}")
    public void handlePaymentFailed(PaymentResultMessage message) {
        try {
            Order order = orderRepository.findById(message.getOrderId())
                    .orElseThrow(() -> new RuntimeException("Order not found: " + message.getOrderId()));

            for (OrderItem item : order.getOrderItems()) {
                inventoryService.increaseStock(item.getProductItem().getItemId(), item.getQuantity());
            }

            String subject = "Payment failed for order #" + message.getOrderId();
            String text = "Payment failed. Order: " + message.getOrderId()
                    + "\nAmount: " + message.getAmount()
                    + "\nResponse code: " + message.getResponseCode();
            emailService.sendSimpleEmail(message.getCustomerEmail(), subject, text);
        } catch (Exception ex) {
            log.error("Failed to handle payment failed message", ex);
            throw ex;
        }
    }
}
