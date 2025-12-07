package iuh.fit.se.backend.service.impl;

import iuh.fit.se.backend.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {
    private final JavaMailSender mailSender;

    @Override
    public void sendVerificationEmail(String to, String token) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Xác thực email của bạn");
        message.setText("Nhấp vào liên kết sau để xác thực email: http://localhost:5173/verify-email?token=" + token);
        mailSender.send(message);
    }

    @Override
    public void sendPasswordResetEmail(String to, String token) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Đặt lại mật khẩu");
        message.setText("Mã đặt lại mật khẩu của bạn là: " + token);
        mailSender.send(message);
    }

    @Override
    public void sendOrderConfirmationEmail(String to, Long orderId) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Xác nhận đơn hàng #" + orderId);
        message.setText("Đơn hàng của bạn đã được tạo thành công. Mã đơn: " + orderId);
        mailSender.send(message);
    }
}