package iuh.fit.se.backend.service.impl;

import iuh.fit.se.backend.model.OtpToken;
import iuh.fit.se.backend.repository.OtpRepository;
import iuh.fit.se.backend.service.OtpService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpServiceImpl implements OtpService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final OtpRepository otpRepository;
    private final JavaMailSender mailSender;

    @Value("${app.otp.expiry-minutes:5}")
    private int expiryMinutes;

    @Value("${spring.mail.username:}")
    private String mailFrom;

    @Override
    public void sendOtp(String email, String purpose) {
        String otp = generateOtp();
        String key = buildKey(email, purpose);

        OtpToken token = OtpToken.builder()
                .id(key)
                .email(email)
                .otp(otp)
                .purpose(purpose)
                .createdAt(LocalDateTime.now())
                .ttl(expiryMinutes * 60L)
                .build();

        otpRepository.save(token);
        sendOtpEmail(email, purpose, otp);
    }

    @Override
    public boolean verifyOtp(String email, String otp, String purpose) {
        String key = buildKey(email, purpose);
        return otpRepository.findById(key)
                .map(token -> {
                    boolean valid = token.getOtp() != null && token.getOtp().equals(otp);
                    if (valid) {
                        otpRepository.deleteById(key);
                    } else {
                        log.warn("Invalid OTP for email {} and purpose {}", email, purpose);
                    }
                    return valid;
                })
                .orElse(false);
    }

    @Override
    public void invalidateOtp(String email, String purpose) {
        otpRepository.deleteById(buildKey(email, purpose));
    }

    private String generateOtp() {
        int number = SECURE_RANDOM.nextInt(1_000_000);
        return String.format("%06d", number);
    }

    private String buildKey(String email, String purpose) {
        return email + ":" + purpose;
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
