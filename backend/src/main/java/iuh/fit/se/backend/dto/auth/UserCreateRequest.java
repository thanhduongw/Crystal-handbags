package iuh.fit.se.backend.dto.auth;

import lombok.Getter;

@Getter
public class UserCreateRequest {
    private String email;
    private String password;
}
