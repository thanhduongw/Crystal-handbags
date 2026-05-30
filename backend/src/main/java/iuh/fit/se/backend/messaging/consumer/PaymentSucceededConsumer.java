package iuh.fit.se.backend.messaging.consumer;

import iuh.fit.se.backend.messaging.event.PaymentSucceededEvent;
import iuh.fit.se.backend.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentSucceededConsumer {

    private final EmailService emailService;

    @RabbitListener(queues = "${app.rabbitmq.queue.payment-succeeded}")
    public void handlePaymentSucceeded(PaymentSucceededEvent event) {
        try {
            String subject = "Payment successful for order #" + event.getOrderId();
            String text = "Payment succeeded."
                    + "\nOrder: " + event.getOrderId()
                    + "\nAmount: " + event.getAmount()
                    + "\nTransaction: " + event.getTxnRef();
            emailService.sendSimpleEmail(event.getEmail(), subject, text);
        } catch (Exception ex) {
            log.error("Failed to process payment succeeded event", ex);
            throw ex;
        }
    }
}
