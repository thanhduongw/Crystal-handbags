package iuh.fit.se.backend.service;

import iuh.fit.se.backend.dto.OrderConfirmationEmailData;

public interface EmailService {
    void sendOrderConfirmation(OrderConfirmationEmailData data);

    void sendSimpleEmail(String to, String subject, String text);
}
