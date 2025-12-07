package iuh.fit.se.backend.service;

import com.nimbusds.jose.JOSEException;
import iuh.fit.se.backend.dto.JwtInfo;
import iuh.fit.se.backend.dto.TokenPayload;
import iuh.fit.se.backend.model.User;

import java.text.ParseException;

public interface JwtService {
    TokenPayload generateAccessToken(User user);
    TokenPayload generateRefreshToken(User user);
    boolean verifyToken(String token) throws ParseException, JOSEException;
    JwtInfo parseToken(String token) throws ParseException;
}
