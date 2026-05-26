package iuh.fit.se.backend.service;

public interface OtpService {
    void sendOtp(String email, String purpose);

    boolean verifyOtp(String email, String otp, String purpose);

    void invalidateOtp(String email, String purpose);
}
