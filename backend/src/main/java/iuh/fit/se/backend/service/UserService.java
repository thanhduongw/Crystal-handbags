package iuh.fit.se.backend.service;

import iuh.fit.se.backend.dto.auth.UserCreateRequest;
import iuh.fit.se.backend.dto.auth.UserCreateResponse;

public interface UserService {
    UserCreateResponse createUser(UserCreateRequest request);
}
