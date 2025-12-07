package iuh.fit.se.backend.service;

public interface EmailService {
    void sendVerificationEmail(String to, String token);
    void sendPasswordResetEmail(String to, String token);
    void sendOrderConfirmationEmail(String to, Long orderId);
}