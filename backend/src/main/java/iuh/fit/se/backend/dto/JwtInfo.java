package iuh.fit.se.backend.dto;

import lombok.*;

import java.io.Serializable;
import java.util.Date;

@Setter
@Getter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class JwtInfo implements Serializable {
    private String jwtId;
    private Date issueTime;
    private Date expiredTime;
}
