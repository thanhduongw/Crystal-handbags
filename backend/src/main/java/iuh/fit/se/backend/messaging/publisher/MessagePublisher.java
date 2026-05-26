package iuh.fit.se.backend.messaging.publisher;

import iuh.fit.se.backend.messaging.EmailNotificationMessage;
import iuh.fit.se.backend.messaging.OrderCreatedMessage;
import iuh.fit.se.backend.messaging.PaymentResultMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.amqp.core.AmqpTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class MessagePublisher {

    private final AmqpTemplate amqpTemplate;

    @Value("${app.rabbitmq.exchange}")
    private String exchange;

    @Value("${app.rabbitmq.queue.order-created}")
    private String orderCreatedKey;

    @Value("${app.rabbitmq.queue.payment-success}")
    private String paymentSuccessKey;

    @Value("${app.rabbitmq.queue.payment-failed}")
    private String paymentFailedKey;

    @Value("${app.rabbitmq.queue.order-cancelled}")
    private String orderCancelledKey;

    public void publishOrderCreated(OrderCreatedMessage message) {
        amqpTemplate.convertAndSend(exchange, orderCreatedKey, message);
    }

    public void publishPaymentSuccess(PaymentResultMessage message) {
        amqpTemplate.convertAndSend(exchange, paymentSuccessKey, message);
    }

    public void publishPaymentFailed(PaymentResultMessage message) {
        amqpTemplate.convertAndSend(exchange, paymentFailedKey, message);
    }

    public void publishOrderCancelled(EmailNotificationMessage message) {
        amqpTemplate.convertAndSend(exchange, orderCancelledKey, message);
    }
}
