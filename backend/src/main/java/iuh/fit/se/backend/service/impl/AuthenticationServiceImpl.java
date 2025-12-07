package iuh.fit.se.backend.service.impl;

import com.nimbusds.jose.JOSEException;
import iuh.fit.se.backend.dto.JwtInfo;
import iuh.fit.se.backend.dto.TokenPayload;
import iuh.fit.se.backend.dto.auth.*;
import iuh.fit.se.backend.model.*;
import iuh.fit.se.backend.repository.RedisTokenRepository;
import iuh.fit.se.backend.repository.UserRepository;
import iuh.fit.se.backend.repository.VerificationTokenRepository;
import iuh.fit.se.backend.service.AuthenticationService;
import iuh.fit.se.backend.service.DatabaseCartService;
import iuh.fit.se.backend.service.EmailService;
import iuh.fit.se.backend.service.JwtService;
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
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthenticationServiceImpl implements AuthenticationService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final RedisTokenRepository redisTokenRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final DatabaseCartService databaseCartService;
    private final EmailService emailService;
    private final VerificationTokenRepository verificationTokenRepository;

    @Override
    public LoginResponse login(LoginRequest request) {
        UsernamePasswordAuthenticationToken authenticationToken =
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword());

        Authentication authentication = authenticationManager.authenticate(authenticationToken);
        User user = (User) authentication.getPrincipal();

        // Check if email is verified
        if (!user.getEmailVerified()) {
            throw new RuntimeException("Please verify your email before logging in");
        }

        TokenPayload accessTokenPayload = jwtService.generateAccessToken(user);
        TokenPayload refreshTokenPayload = jwtService.generateRefreshToken(user);

        // Store refresh token info (for rotation tracking)
        redisTokenRepository.save(RedisToken.builder()
                .jwtId(refreshTokenPayload.getJwtId())
                .expiredTime(refreshTokenPayload.getExpiredTime().getTime() / 1000)
                .build());

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

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phoneNumber(request.getPhoneNumber())
                .role(Role.CUSTOMER)
                .emailVerified(false)
                .createdAt(LocalDateTime.now())
                .build();

        userRepository.save(user);

        // Generate verification token
        String token = UUID.randomUUID().toString();
        VerificationToken verificationToken = VerificationToken.builder()
                .token(token)
                .user(user)
                .expiryDate(LocalDateTime.now().plusHours(24))
                .tokenType(VerificationToken.TokenType.EMAIL_VERIFICATION)
                .used(false)
                .build();

        verificationTokenRepository.save(verificationToken);

        // Send verification email
        emailService.sendVerificationEmail(user.getEmail(), token);

        return RegisterResponse.builder()
                .email(user.getEmail())
                .message("Registration successful. Please check your email to verify your account.")
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
            redisTokenRepository.save(RedisToken.builder()
                    .jwtId(newRefreshToken.getJwtId())
                    .expiredTime(newRefreshToken.getExpiredTime().getTime() / 1000)
                    .build());

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
    @Transactional
    public void verifyEmail(String token) {
        VerificationToken verificationToken = verificationTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid verification token"));

        if (verificationToken.isExpired()) {
            throw new RuntimeException("Verification token has expired");
        }

        if (verificationToken.isUsed()) {
            throw new RuntimeException("Verification token has already been used");
        }

        if (verificationToken.getTokenType() != VerificationToken.TokenType.EMAIL_VERIFICATION) {
            throw new RuntimeException("Invalid token type");
        }

        User user = verificationToken.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);

        verificationToken.setUsed(true);
        verificationTokenRepository.save(verificationToken);
    }

    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Generate password reset token
        String token = UUID.randomUUID().toString();
        VerificationToken resetToken = VerificationToken.builder()
                .token(token)
                .user(user)
                .expiryDate(LocalDateTime.now().plusHours(1))
                .tokenType(VerificationToken.TokenType.PASSWORD_RESET)
                .used(false)
                .build();

        verificationTokenRepository.save(resetToken);

        // Send password reset email
        emailService.sendPasswordResetEmail(user.getEmail(), token);
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        VerificationToken resetToken = verificationTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new RuntimeException("Invalid reset token"));

        if (resetToken.isExpired()) {
            throw new RuntimeException("Reset token has expired");
        }

        if (resetToken.isUsed()) {
            throw new RuntimeException("Reset token has already been used");
        }

        if (resetToken.getTokenType() != VerificationToken.TokenType.PASSWORD_RESET) {
            throw new RuntimeException("Invalid token type");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        resetToken.setUsed(true);
        verificationTokenRepository.save(resetToken);
    }
}