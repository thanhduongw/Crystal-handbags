package iuh.fit.se.backend.dto.auth;

import lombok.Data;

@Data
public class VerifyEmailRequest {
    private String token;
}