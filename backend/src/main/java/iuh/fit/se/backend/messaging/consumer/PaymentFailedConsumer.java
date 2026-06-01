package iuh.fit.se.backend.messaging.consumer;

import iuh.fit.se.backend.messaging.event.PaymentFailedEvent;
import iuh.fit.se.backend.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentFailedConsumer {

    private final EmailService emailService;

    @RabbitListener(queues = "${app.rabbitmq.queue.payment-failed}")
    public void handlePaymentFailed(PaymentFailedEvent event) {
        try {
            String subject = "Payment failed for order #" + event.getOrderId();
            String text = "Payment failed."
                    + "\nOrder: " + event.getOrderId()
                    + "\nAmount: " + event.getAmount()
                    + "\nResponse code: " + event.getResponseCode();
            emailService.sendSimpleEmail(event.getEmail(), subject, text);
        } catch (Exception ex) {
            log.error("Failed to process payment failed event", ex);
            throw ex;
        }
    }
}
