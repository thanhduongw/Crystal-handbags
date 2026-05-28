package iuh.fit.se.backend.controller;

import iuh.fit.se.backend.dto.UserProfileDto;
import iuh.fit.se.backend.dto.auth.UserCreateRequest;
import iuh.fit.se.backend.dto.auth.UserCreateResponse;
import iuh.fit.se.backend.model.User;
import iuh.fit.se.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @PostMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public UserCreateResponse createUser(@Valid @RequestBody UserCreateRequest userCreateRequest) {
        return userService.createUser(userCreateRequest);
    }

    @PostMapping("/admin/users")
    @PreAuthorize("hasRole('ADMIN')")
    public UserCreateResponse createAdminUser(@Valid @RequestBody UserCreateRequest userCreateRequest) {
        return userService.createUser(userCreateRequest);
    }

    @GetMapping("/users/profile")
    public UserProfileDto getProfile(@AuthenticationPrincipal Jwt jwt) {
        return userService.getUserProfile(jwt.getSubject());
    }

    @PutMapping("/users/profile")
    public UserProfileDto updateProfile(@AuthenticationPrincipal Jwt jwt,
            @RequestBody UserProfileDto profileDto) {
        return userService.updateUserProfile(jwt.getSubject(), profileDto);
    }

    // Admin endpoints - thêm prefix /admin
    @GetMapping("/admin/users")
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserProfileDto> getAllUsers() {
        return userService.getAllUsersDto();
    }

    @GetMapping("/admin/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public UserProfileDto getUserById(@PathVariable Long id) {
        return userService.getUserByIdDto(id);
    }

    @PutMapping("/admin/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public UserProfileDto updateUser(@PathVariable Long id, @RequestBody UserProfileDto userDto) {
        return userService.updateUserById(id, userDto);
    }

    @DeleteMapping("/admin/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok().build();
    }
}
