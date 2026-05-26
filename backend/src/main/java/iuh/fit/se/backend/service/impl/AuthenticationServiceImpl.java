package iuh.fit.se.backend.service.impl;

import com.nimbusds.jose.JOSEException;
import iuh.fit.se.backend.dto.JwtInfo;
import iuh.fit.se.backend.dto.TokenPayload;
import iuh.fit.se.backend.dto.auth.*;
import iuh.fit.se.backend.model.*;
import iuh.fit.se.backend.repository.RedisTokenRepository;
import iuh.fit.se.backend.repository.RoleRepository;
import iuh.fit.se.backend.repository.UserRepository;
import iuh.fit.se.backend.service.AuthenticationService;
import iuh.fit.se.backend.service.JwtService;
import iuh.fit.se.backend.service.OtpService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.ParseException;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthenticationServiceImpl implements AuthenticationService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final RedisTokenRepository redisTokenRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final OtpService otpService;
    private final PasswordEncoder passwordEncoder;

    @Override
    public LoginResponse login(LoginRequest request) {
        UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                request.getEmail(), request.getPassword());

        Authentication authentication = authenticationManager.authenticate(authenticationToken);
        User user = (User) authentication.getPrincipal();

        TokenPayload accessTokenPayload = jwtService.generateAccessToken(user);
        TokenPayload refreshTokenPayload = jwtService.generateRefreshToken(user);

        // Store refresh token info (for rotation tracking)
        // redisTokenRepository.save(RedisToken.builder()
        // .jwtId(refreshTokenPayload.getJwtId())
        // .expiredTime(refreshTokenPayload.getExpiredTime().getTime() / 1000)
        // .build());

        return LoginResponse.builder()
                .accessToken(accessTokenPayload.getToken())
                .refreshToken(refreshTokenPayload.getToken())
                .build();
    }

    @Override
    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        boolean otpValid = otpService.verifyOtp(request.getEmail(), request.getOtp(), "REGISTER");
        if (!otpValid) {
            throw new RuntimeException("Invalid OTP");
        }

        Role customerRole = roleRepository.findByName("CUSTOMER")
                .orElseThrow(() -> new RuntimeException("Role CUSTOMER not found"));

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phoneNumber(request.getPhoneNumber())
                .roles(Set.of(customerRole))
                .createdAt(LocalDateTime.now())
                .build();

        userRepository.save(user);

        return RegisterResponse.builder()
                .email(user.getEmail())
                .message("Registration successful. You can now login.")
                .build();
    }

    @Override
    public LoginResponse refreshToken(RefreshTokenRequest request) {
        try {
            String refreshToken = request.getRefreshToken();

            // Verify refresh token
            if (!jwtService.verifyToken(refreshToken)) {
                throw new RuntimeException("Invalid refresh token");
            }

            // Parse token to get user info
            JwtInfo jwtInfo = jwtService.parseToken(refreshToken);

            // Get user email from token subject
            JwtServiceImpl jwtServiceImpl = (JwtServiceImpl) jwtService;
            String email = jwtServiceImpl.getSubjectFromToken(refreshToken);

            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Generate new tokens
            TokenPayload newAccessToken = jwtService.generateAccessToken(user);
            TokenPayload newRefreshToken = jwtService.generateRefreshToken(user);

            // Blacklist old refresh token
            redisTokenRepository.save(RedisToken.builder()
                    .jwtId(jwtInfo.getJwtId())
                    .expiredTime((jwtInfo.getExpiredTime().getTime() - jwtInfo.getIssueTime().getTime()) / 1000)
                    .build());

            // Save new refresh token
            // redisTokenRepository.save(RedisToken.builder()
            // .jwtId(newRefreshToken.getJwtId())
            // .expiredTime(newRefreshToken.getExpiredTime().getTime() / 1000)
            // .build());

            return LoginResponse.builder()
                    .accessToken(newAccessToken.getToken())
                    .refreshToken(newRefreshToken.getToken())
                    .build();

        } catch (ParseException | JOSEException e) {
            throw new RuntimeException("Failed to refresh token", e);
        }
    }

    @Override
    public void logout(String token) throws ParseException {
        JwtInfo jwtInfo = jwtService.parseToken(token);
        String jwtId = jwtInfo.getJwtId();
        Date issueTime = jwtInfo.getIssueTime();
        Date expiredTime = jwtInfo.getExpiredTime();

        if (expiredTime.before(new Date())) {
            return;
        }

        RedisToken redisToken = RedisToken.builder()
                .jwtId(jwtId)
                .expiredTime((expiredTime.getTime() - issueTime.getTime()) / 1000)
                .build();

        redisTokenRepository.save(redisToken);
    }

    @Override
    public void sendOtp(SendOtpRequest request) {
        String purpose = request.getPurpose();
        String email = request.getEmail();

        if ("REGISTER".equals(purpose) && userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already exists");
        }

        if (("RESET_PASSWORD".equals(purpose) || "LOGIN_2FA".equals(purpose))
                && !userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email not found");
        }

        otpService.sendOtp(email, purpose);
    }

    @Override
    public boolean verifyOtp(VerifyOtpRequest request) {
        return otpService.verifyOtp(request.getEmail(), request.getOtp(), request.getPurpose());
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        boolean valid = otpService.verifyOtp(request.getEmail(), request.getOtp(), "RESET_PASSWORD");
        if (!valid) {
            throw new RuntimeException("Invalid OTP");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}
