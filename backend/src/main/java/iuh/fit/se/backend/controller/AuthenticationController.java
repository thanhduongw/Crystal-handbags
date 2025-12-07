package iuh.fit.se.backend.controller;

import iuh.fit.se.backend.dto.auth.LoginRequest;
import iuh.fit.se.backend.dto.auth.LoginResponse;
import iuh.fit.se.backend.service.AuthenticationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import java.text.ParseException;

@RestController
@RequiredArgsConstructor
public class AuthenticationController {
    private final AuthenticationService authenticationService;

    @PostMapping("/auth/login")
    LoginResponse login(@RequestBody LoginRequest loginRequest) {
        return authenticationService.login(loginRequest);
    }

    @PostMapping("/auth/logout")
    void logout(@RequestHeader("Authorization") String authHeader) throws ParseException {
        String token = authHeader.replace("Bearer ", "");
        authenticationService.logout(token);
    }
}
