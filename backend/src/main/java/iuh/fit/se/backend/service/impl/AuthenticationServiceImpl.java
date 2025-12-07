package iuh.fit.se.backend.service.impl;

import iuh.fit.se.backend.dto.JwtInfo;
import iuh.fit.se.backend.dto.TokenPayload;
import iuh.fit.se.backend.dto.auth.LoginRequest;
import iuh.fit.se.backend.dto.auth.LoginResponse;
import iuh.fit.se.backend.model.RedisToken;
import iuh.fit.se.backend.model.User;
import iuh.fit.se.backend.repository.RedisTokenRepository;
import iuh.fit.se.backend.service.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.text.ParseException;
import java.util.Date;

@Service
@RequiredArgsConstructor
public class AuthenticationServiceImpl implements iuh.fit.se.backend.service.AuthenticationService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final RedisTokenRepository redisTokenRepository;

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
}
