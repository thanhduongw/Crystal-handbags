package iuh.fit.se.backend.config;

import com.nimbusds.jose.JOSEException;
import iuh.fit.se.backend.service.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.text.ParseException;
import java.util.Objects;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtDecoderConfig implements JwtDecoder {

    @Value("${jwt.secret}")
    private String secretKey;
    private final JwtService jwtService;
    private NimbusJwtDecoder nimbusJwtDecoder;

    @Override
    public Jwt decode(String token) throws JwtException {
        try {
            // 1. Không làm gì nếu không có token
            if (token == null || token.isBlank()) {
                throw new BadJwtException("No token provided");
            }

            // 2. Kiểm tra signature & expiry
            if (!jwtService.verifyToken(token)) {
                throw new BadJwtException("Invalid token");
            }

            // 3. Decode bình thường
            if (nimbusJwtDecoder == null) {
                SecretKey secretKeySpec = new SecretKeySpec(
                        secretKey.getBytes(StandardCharsets.UTF_8), "HS512");
                nimbusJwtDecoder = NimbusJwtDecoder.withSecretKey(secretKeySpec)
                        .macAlgorithm(MacAlgorithm.HS512)
                        .build();
            }
            return nimbusJwtDecoder.decode(token);

        } catch (ParseException | JOSEException e) {
            throw new BadJwtException("Malformed token", e);
        } catch (RuntimeException e) {
            throw new BadJwtException("Invalid token", e);
        }
    }
}
