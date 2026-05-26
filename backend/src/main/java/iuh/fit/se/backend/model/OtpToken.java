package iuh.fit.se.backend.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.redis.core.RedisHash;
import org.springframework.data.redis.core.TimeToLive;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@RedisHash("OtpToken")
public class OtpToken {
    @Id
    private String id;

    private String email;
    private String otp;
    private String purpose;
    private LocalDateTime createdAt;

    @TimeToLive(unit = TimeUnit.SECONDS)
    private Long ttl;
}
