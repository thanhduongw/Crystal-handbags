package iuh.fit.se.backend.messaging.publisher;

import iuh.fit.se.backend.messaging.event.OrderCancelledEvent;
import iuh.fit.se.backend.messaging.event.OrderCreatedEvent;
import iuh.fit.se.backend.messaging.event.PaymentFailedEvent;
import iuh.fit.se.backend.messaging.event.PaymentSucceededEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.core.AmqpTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class MessagePublisher {

    private final AmqpTemplate amqpTemplate;

    @Value("${app.rabbitmq.exchange}")
    private String exchange;

    @Value("${app.rabbitmq.routing-key.order-created}")
    private String orderCreatedRoutingKey;

    @Value("${app.rabbitmq.routing-key.order-cancelled}")
    private String orderCancelledRoutingKey;

    @Value("${app.rabbitmq.routing-key.payment-succeeded}")
    private String paymentSucceededRoutingKey;

    @Value("${app.rabbitmq.routing-key.payment-failed}")
    private String paymentFailedRoutingKey;

    public void publishOrderCreated(OrderCreatedEvent event) {
        publish(orderCreatedRoutingKey, event);
    }

    public void publishOrderCancelled(OrderCancelledEvent event) {
        publish(orderCancelledRoutingKey, event);
    }

    public void publishPaymentSucceeded(PaymentSucceededEvent event) {
        publish(paymentSucceededRoutingKey, event);
    }

    public void publishPaymentFailed(PaymentFailedEvent event) {
        publish(paymentFailedRoutingKey, event);
    }

    private void publish(String routingKey, Object event) {
        try {
            log.info("Publishing RabbitMQ event exchange={}, routingKey={}, payload={}",
                    exchange, routingKey, event);
            amqpTemplate.convertAndSend(exchange, routingKey, event);
        } catch (AmqpException ex) {
            log.error("Failed to publish RabbitMQ event exchange={}, routingKey={}, payload={}",
                    exchange, routingKey, event, ex);
            throw ex;
        }
    }
}
