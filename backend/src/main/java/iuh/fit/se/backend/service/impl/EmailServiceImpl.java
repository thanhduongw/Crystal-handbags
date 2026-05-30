package iuh.fit.se.backend.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import iuh.fit.se.backend.dto.OrderConfirmationEmailData;
import iuh.fit.se.backend.service.EmailService;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;
    private final ObjectMapper objectMapper;

    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Value("${spring.mail.username:}")
    private String mailFrom;

    @Value("${app.frontend.url:}")
    private String defaultFrontendUrl;

    @Value("${app.resend.api-key:}")
    private String resendApiKey;

    @Value("${app.resend.from-email:}")
    private String resendFromEmail;

    @Override
    public void sendOrderConfirmation(OrderConfirmationEmailData data) {
        try {
            String subject = "Order confirmation #" + data.getOrderId();
            String html = buildOrderConfirmationHtml(data);

            if (isResendConfigured()) {
                sendViaResend(data.getCustomerEmail(), subject, null, html);
                return;
            }

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    message,
                    MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                    StandardCharsets.UTF_8.name());

            if (mailFrom != null && !mailFrom.isBlank()) {
                helper.setFrom(new InternetAddress(mailFrom, "Handbag Shop"));
            }
            helper.setTo(data.getCustomerEmail());
            helper.setSubject(subject);
            helper.setText(html, true);

            mailSender.send(message);
        } catch (Exception ex) {
            throw new RuntimeException("Failed to send order confirmation email", ex);
        }
    }

    @Override
    public void sendSimpleEmail(String to, String subject, String text) {
        if (isResendConfigured()) {
            sendViaResend(to, subject, text, null);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        if (mailFrom != null && !mailFrom.isBlank()) {
            message.setFrom(mailFrom);
        }
        message.setSubject(subject);
        message.setText(text);
        mailSender.send(message);
    }

    private String buildOrderConfirmationHtml(OrderConfirmationEmailData data) {
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

        return templateEngine.process("order-confirmation", context);
    }

    private boolean isResendConfigured() {
        return resendApiKey != null && !resendApiKey.isBlank();
    }

    private void sendViaResend(String to, String subject, String text, String html) {
        String from = resendFromEmail != null && !resendFromEmail.isBlank()
                ? resendFromEmail
                : mailFrom;

        if (from == null || from.isBlank()) {
            throw new RuntimeException("Resend is configured but RESEND_FROM_EMAIL is missing.");
        }

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("from", from);
            payload.put("to", List.of(to));
            payload.put("subject", subject);
            if (html != null && !html.isBlank()) {
                payload.put("html", html);
            } else {
                payload.put("text", text);
            }

            String body = objectMapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.resend.com/emails"))
                    .header("Authorization", "Bearer " + resendApiKey.trim())
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.error("Resend email failed with status {} and body {}", response.statusCode(), response.body());
                throw new RuntimeException("Failed to send email via Resend. Status: " + response.statusCode());
            }
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Failed to send email via Resend.", ex);
        } catch (Exception ex) {
            throw new RuntimeException("Failed to send email via Resend.", ex);
        }
    }
}
