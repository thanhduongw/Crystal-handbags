package iuh.fit.se.backend.service.impl;

import iuh.fit.se.backend.dto.OrderConfirmationEmailData;
import iuh.fit.se.backend.service.EmailService;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${spring.mail.username:}")
    private String mailFrom;

    @Value("${app.frontend.url:}")
    private String defaultFrontendUrl;

    @Override
    public void sendOrderConfirmation(OrderConfirmationEmailData data) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    message,
                    MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                    StandardCharsets.UTF_8.name());

            Context context = new Context();
            context.setVariable("customerName", data.getCustomerName());
            context.setVariable("orderId", data.getOrderId());
            context.setVariable("orderDate", data.getOrderDate());
            context.setVariable("paymentMethod", data.getPaymentMethod());
            context.setVariable("items", data.getItems());
            context.setVariable("subtotal", data.getSubtotal());
            context.setVariable("shippingFee", data.getShippingFee());
            context.setVariable("totalAmount", data.getTotalAmount());
            context.setVariable("receiverName", data.getReceiverName());
            context.setVariable("receiverPhone", data.getReceiverPhone());
            context.setVariable("fullAddress", data.getFullAddress());
            context.setVariable("frontendUrl", data.getFrontendUrl() != null
                    ? data.getFrontendUrl()
                    : defaultFrontendUrl);

            String html = templateEngine.process("order-confirmation", context);

            if (mailFrom != null && !mailFrom.isBlank()) {
                helper.setFrom(new InternetAddress(mailFrom, "Handbag Shop"));
            }
            helper.setTo(data.getCustomerEmail());
            helper.setSubject("Order confirmation #" + data.getOrderId());
            helper.setText(html, true);

            mailSender.send(message);
        } catch (Exception ex) {
            throw new RuntimeException("Failed to send order confirmation email", ex);
        }
    }

    @Override
    public void sendSimpleEmail(String to, String subject, String text) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        if (mailFrom != null && !mailFrom.isBlank()) {
            message.setFrom(mailFrom);
        }
        message.setSubject(subject);
        message.setText(text);
        mailSender.send(message);
    }
}
