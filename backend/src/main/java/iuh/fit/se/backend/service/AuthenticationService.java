package iuh.fit.se.backend.service;

import iuh.fit.se.backend.dto.auth.LoginRequest;
import iuh.fit.se.backend.dto.auth.LoginResponse;

import java.text.ParseException;

public interface AuthenticationService {
    LoginResponse login(LoginRequest request);
    void logout(String token) throws ParseException;
}
