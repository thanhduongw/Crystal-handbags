package iuh.fit.se.backend.service.impl;

import iuh.fit.se.backend.dto.auth.UserCreateRequest;
import iuh.fit.se.backend.dto.auth.UserCreateResponse;
import iuh.fit.se.backend.model.User;
import iuh.fit.se.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements iuh.fit.se.backend.service.UserService {
    private final UserRepository userRepository;

    @Override
    public UserCreateResponse createUser(UserCreateRequest request) {
        if(userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email da ton tai");
        }

        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .build();

        userRepository.save(user);

        return UserCreateResponse.builder()
                .email(user.getEmail())
                .build();
    }
}
