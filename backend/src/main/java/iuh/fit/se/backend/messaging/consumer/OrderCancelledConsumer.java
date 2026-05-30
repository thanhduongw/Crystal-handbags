package iuh.fit.se.backend.messaging.consumer;

import iuh.fit.se.backend.messaging.event.OrderCancelledEvent;
import iuh.fit.se.backend.service.EmailService;
import iuh.fit.se.backend.service.InventoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderCancelledConsumer {

    private final InventoryService inventoryService;
    private final EmailService emailService;

    @RabbitListener(queues = "${app.rabbitmq.queue.order-cancelled}")
    public void handleOrderCancelled(OrderCancelledEvent event) {
        try {
            if (event.getInventoryItems() != null) {
                for (OrderCancelledEvent.InventoryLine item : event.getInventoryItems()) {
                    inventoryService.increaseStock(item.getItemId(), item.getQuantity());
                }
            }

            String subject = "Order cancelled #" + event.getOrderId();
            String text = "Your order has been cancelled."
                    + "\nOrder: " + event.getOrderId()
                    + "\nReason: " + event.getReason();
            emailService.sendSimpleEmail(event.getEmail(), subject, text);
        } catch (Exception ex) {
            log.error("Failed to process order cancelled event", ex);
            throw ex;
        }
    }
}
