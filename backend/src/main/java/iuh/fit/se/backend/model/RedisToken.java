package iuh.fit.se.backend.model;


import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.redis.core.RedisHash;
import org.springframework.data.redis.core.TimeToLive;

import java.util.concurrent.TimeUnit;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@RedisHash("RedisHas")
@Builder
public class RedisToken {
    @Id
    private String jwtId;

    @TimeToLive(unit = TimeUnit.DAYS)
    private Long expiredTime;
}
