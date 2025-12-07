package iuh.fit.se.backend.controller;

import iuh.fit.se.backend.dto.auth.UserCreateRequest;
import iuh.fit.se.backend.dto.auth.UserCreateResponse;
import iuh.fit.se.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @PostMapping("/users")
    public UserCreateResponse createUser(@RequestBody UserCreateRequest userCreateRequest) {
        return userService.createUser(userCreateRequest);
    }
}
