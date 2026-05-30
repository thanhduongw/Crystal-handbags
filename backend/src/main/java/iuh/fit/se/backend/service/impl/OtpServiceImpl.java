package iuh.fit.se.backend.service.impl;

import iuh.fit.se.backend.constants.RedisKeyConstants;
import iuh.fit.se.backend.service.OtpService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpServiceImpl implements OtpService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int MAX_VERIFY_ATTEMPTS = 5;
    private static final int MAX_RESEND_PER_HOUR = 5;

    private final StringRedisTemplate stringRedisTemplate;
    private final JavaMailSender mailSender;

    @Value("${app.otp.expiry-minutes:5}")
    private int expiryMinutes;

    @Value("${spring.mail.username:}")
    private String mailFrom;

    @Override
    public void sendOtp(String email, String purpose) {
        enforceResendLimit(email, purpose);

        String otp = generateOtp();
        String otpKey = RedisKeyConstants.otpKey(purpose, email);
        stringRedisTemplate.opsForValue().set(otpKey, otp, Duration.ofMinutes(expiryMinutes));

        stringRedisTemplate.delete(RedisKeyConstants.otpAttemptKey(purpose, email));
        sendOtpEmail(email, purpose, otp);
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

    private void enforceResendLimit(String email, String purpose) {
        String resendKey = RedisKeyConstants.otpResendKey(purpose, email);
        Long resendCount = stringRedisTemplate.opsForValue().increment(resendKey);
        if (Long.valueOf(1).equals(resendCount)) {
            stringRedisTemplate.expire(resendKey, Duration.ofHours(1));
        }
        if (resendCount != null && resendCount > MAX_RESEND_PER_HOUR) {
            throw new RuntimeException("OTP resend limit exceeded. Please try again later.");
        }
    }

    private String generateOtp() {
        int number = SECURE_RANDOM.nextInt(1_000_000);
        return String.format("%06d", number);
    }

    private void sendOtpEmail(String email, String purpose, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        if (mailFrom != null && !mailFrom.isBlank()) {
            message.setFrom(mailFrom);
        }
        message.setSubject(buildSubject(purpose));
        message.setText(buildBody(purpose, otp));
        mailSender.send(message);
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
