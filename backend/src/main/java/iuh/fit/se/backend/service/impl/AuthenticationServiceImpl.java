package iuh.fit.se.backend.service.impl;

import iuh.fit.se.backend.dto.JwtInfo;
import iuh.fit.se.backend.dto.TokenPayload;
import iuh.fit.se.backend.dto.auth.*;
import iuh.fit.se.backend.model.RedisToken;
import iuh.fit.se.backend.model.User;
import iuh.fit.se.backend.repository.RedisTokenRepository;
import iuh.fit.se.backend.repository.UserRepository;
import iuh.fit.se.backend.service.AuthenticationService;
import iuh.fit.se.backend.service.DatabaseCartService;
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
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthenticationServiceImpl implements iuh.fit.se.backend.service.AuthenticationService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final RedisTokenRepository redisTokenRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final DatabaseCartService databaseCartService;

    @Override
    public LoginResponse login(LoginRequest request) {
        UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                request.getEmail(), request.getPassword()
        );
        Authentication authentication =
                authenticationManager.authenticate(authenticationToken);

        User user = (User) authentication.getPrincipal();


        TokenPayload accessTokenPayload = jwtService.generateAccessToken(user);
        TokenPayload refreshTokenPayload = jwtService.generateRefreshToken(user);

        redisTokenRepository.save(RedisToken.builder()
                        .jwtId(refreshTokenPayload.getJwtId())
                        .expiredTime(refreshTokenPayload.getExpiredTime().getTime())
                .build());

        return LoginResponse.builder()
                .accessToken(accessTokenPayload.getToken())
                .refreshToken(refreshTokenPayload.getToken())
                .build();
    }

    @Override
    public RegisterResponse register(RegisterRequest request) {
        return null;
    }

    @Override
    public LoginResponse refreshToken(RefreshTokenRequest request) {
        return null;
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
                .expiredTime(expiredTime.getTime() - issueTime.getTime())
                .build();

        redisTokenRepository.save(redisToken);
    }

    @Override
    public void verifyEmail(String token) {

    }

    @Override
    public void forgotPassword(ForgotPasswordRequest request) {

    }

    @Override
    public void resetPassword(ResetPasswordRequest request) {

    }

}
