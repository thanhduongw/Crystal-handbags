package iuh.fit.se.backend.controller;

import iuh.fit.se.backend.dto.auth.*;
import iuh.fit.se.backend.service.AuthenticationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.text.ParseException;

@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthenticationController {
    private final AuthenticationService authenticationService;

    @PostMapping("/register")
    public RegisterResponse register(@RequestBody RegisterRequest request) {
        return authenticationService.register(request);
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest loginRequest) {
        return authenticationService.login(loginRequest);
    }

    @PostMapping("/logout")
    public void logout(@RequestHeader("Authorization") String authHeader) throws ParseException {
        String token = authHeader.replace("Bearer ", "");
        authenticationService.logout(token);
    }

    @PostMapping("/refresh-token")
    public LoginResponse refreshToken(@RequestBody RefreshTokenRequest request) {
        return authenticationService.refreshToken(request);
    }
}