package iuh.fit.se.backend.dto;

import lombok.*;

import java.util.Date;

@Getter
@Setter
@Builder
public class TokenPayload {
    private String token;
    private String jwtId;
    private Date expiredTime;
}
