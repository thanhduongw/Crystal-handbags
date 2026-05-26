package iuh.fit.se.backend.service;

import iuh.fit.se.backend.dto.auth.*;

import java.text.ParseException;

public interface AuthenticationService {
    LoginResponse login(LoginRequest request);

    RegisterResponse register(RegisterRequest request);

    LoginResponse refreshToken(RefreshTokenRequest request);

    void logout(String token) throws ParseException;

    void sendOtp(SendOtpRequest request);

    boolean verifyOtp(VerifyOtpRequest request);

    void resetPassword(ResetPasswordRequest request);
}