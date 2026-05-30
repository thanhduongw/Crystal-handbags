package iuh.fit.se.backend.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import iuh.fit.se.backend.constants.RedisKeyConstants;
import iuh.fit.se.backend.service.OtpService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpServiceImpl implements OtpService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int MAX_VERIFY_ATTEMPTS = 5;
    private static final int MAX_RESEND_PER_HOUR = 5;

    private final StringRedisTemplate stringRedisTemplate;
    private final JavaMailSender mailSender;
    private final ObjectMapper objectMapper;

    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Value("${app.otp.expiry-minutes:5}")
    private int expiryMinutes;

    @Value("${spring.mail.username:}")
    private String mailFrom;

    @Value("${app.resend.api-key:}")
    private String resendApiKey;

    @Value("${app.resend.from-email:}")
    private String resendFromEmail;

    @Override
    public void sendOtp(String email, String purpose) {
        String resendKey = enforceResendLimit(email, purpose);

        String otp = generateOtp();
        String otpKey = RedisKeyConstants.otpKey(purpose, email);
        stringRedisTemplate.opsForValue().set(otpKey, otp, Duration.ofMinutes(expiryMinutes));

        stringRedisTemplate.delete(RedisKeyConstants.otpAttemptKey(purpose, email));
        try {
            sendOtpEmail(email, purpose, otp);
        } catch (RuntimeException ex) {
            rollbackOtpStateAfterMailFailure(email, purpose, otpKey, resendKey);
            throw ex;
        }
        log.info("OTP sent for email {} and purpose {}", email, purpose);
    }

    @Override
    public boolean verifyOtp(String email, String otp, String purpose) {
        String otpKey = RedisKeyConstants.otpKey(purpose, email);
        String storedOtp = stringRedisTemplate.opsForValue().get(otpKey);

        if (storedOtp == null) {
            return false;
        }

        if (storedOtp.equals(otp)) {
            invalidateOtp(email, purpose);
            return true;
        }

        Long attempts = stringRedisTemplate.opsForValue()
                .increment(RedisKeyConstants.otpAttemptKey(purpose, email));
        stringRedisTemplate.expire(
                RedisKeyConstants.otpAttemptKey(purpose, email),
                Duration.ofMinutes(expiryMinutes));

        log.warn("Invalid OTP attempt {} for email {} and purpose {}", attempts, email, purpose);
        if (attempts != null && attempts >= MAX_VERIFY_ATTEMPTS) {
            invalidateOtp(email, purpose);
            throw new RuntimeException("OTP verification attempts exceeded. Please request a new OTP.");
        }
        return false;
    }

    @Override
    public void invalidateOtp(String email, String purpose) {
        stringRedisTemplate.delete(RedisKeyConstants.otpKey(purpose, email));
        stringRedisTemplate.delete(RedisKeyConstants.otpAttemptKey(purpose, email));
    }

    private String enforceResendLimit(String email, String purpose) {
        String resendKey = RedisKeyConstants.otpResendKey(purpose, email);
        Long resendCount = stringRedisTemplate.opsForValue().increment(resendKey);
        if (Long.valueOf(1).equals(resendCount)) {
            stringRedisTemplate.expire(resendKey, Duration.ofHours(1));
        }
        if (resendCount != null && resendCount > MAX_RESEND_PER_HOUR) {
            throw new RuntimeException("OTP resend limit exceeded. Please try again later.");
        }
        return resendKey;
    }

    private void rollbackOtpStateAfterMailFailure(String email, String purpose, String otpKey, String resendKey) {
        stringRedisTemplate.delete(otpKey);
        stringRedisTemplate.delete(RedisKeyConstants.otpAttemptKey(purpose, email));

        Long resendCount = stringRedisTemplate.opsForValue().decrement(resendKey);
        if (resendCount == null || resendCount <= 0) {
            stringRedisTemplate.delete(resendKey);
        }
    }

    private String generateOtp() {
        int number = SECURE_RANDOM.nextInt(1_000_000);
        return String.format("%06d", number);
    }

    private void sendOtpEmail(String email, String purpose, String otp) {
        if (resendApiKey != null && !resendApiKey.isBlank()) {
            sendOtpEmailViaResend(email, purpose, otp);
            return;
        }

        if (mailFrom == null || mailFrom.isBlank()) {
            throw new RuntimeException("Gmail SMTP is not configured. Set GMAIL_USERNAME and GMAIL_APP_PASSWORD.");
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setFrom(mailFrom);
        message.setSubject(buildSubject(purpose));
        message.setText(buildBody(purpose, otp));
        try {
            mailSender.send(message);
        } catch (MailException ex) {
            log.error("Failed to send OTP email to {} for purpose {}", email, purpose, ex);
            throw new RuntimeException("Failed to send OTP email. Check Gmail SMTP credentials and Render env vars.", ex);
        }
    }

    private void sendOtpEmailViaResend(String email, String purpose, String otp) {
        String from = resendFromEmail != null && !resendFromEmail.isBlank()
                ? resendFromEmail
                : mailFrom;

        if (from == null || from.isBlank()) {
            throw new RuntimeException("Resend is configured but RESEND_FROM_EMAIL is missing.");
        }

        try {
            String body = objectMapper.writeValueAsString(Map.of(
                    "from", from,
                    "to", List.of(email),
                    "subject", buildSubject(purpose),
                    "text", buildBody(purpose, otp)
            ));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.resend.com/emails"))
                    .header("Authorization", "Bearer " + resendApiKey.trim())
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.error("Resend OTP email failed with status {} and body {}", response.statusCode(), response.body());
                throw new RuntimeException("Failed to send OTP email via Resend. Status: " + response.statusCode());
            }
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Failed to send OTP email via Resend.", ex);
        } catch (Exception ex) {
            throw new RuntimeException("Failed to send OTP email via Resend.", ex);
        }
    }

    private String buildSubject(String purpose) {
        return switch (purpose) {
            case "REGISTER" -> "Your OTP for registration";
            case "RESET_PASSWORD" -> "Your OTP to reset password";
            case "LOGIN_2FA" -> "Your OTP for login";
            default -> "Your OTP";
        };
    }

    private String buildBody(String purpose, String otp) {
        return "Purpose: " + purpose + "\n"
                + "OTP: " + otp + "\n"
                + "This OTP expires in " + expiryMinutes + " minutes.";
    }
}
