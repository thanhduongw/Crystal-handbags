package iuh.fit.se.backend.service.impl;

import iuh.fit.se.backend.dto.UserProfileDto;
import iuh.fit.se.backend.dto.auth.UserCreateRequest;
import iuh.fit.se.backend.dto.auth.UserCreateResponse;
import iuh.fit.se.backend.model.Gender;
import iuh.fit.se.backend.model.User;
import iuh.fit.se.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements iuh.fit.se.backend.service.UserService {
    private final UserRepository userRepository;

    @Override
    public UserCreateResponse createUser(UserCreateRequest request) {
        if(userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
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

    @Override
    public UserProfileDto getUserProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return convertToProfileDto(user);
    }

    @Override
    public UserProfileDto updateUserProfile(String email, UserProfileDto userProfileDto) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setFirstName(userProfileDto.getFirstName());
        user.setLastName(userProfileDto.getLastName());
        user.setPhoneNumber(userProfileDto.getPhoneNumber());

        if (userProfileDto.getGender() != null) {
            user.setGender(Gender.valueOf(userProfileDto.getGender()));
        }

        user.setDob(userProfileDto.getDob());
        user.setPhotoUrl(userProfileDto.getPhotoUrl());

        userRepository.save(user);
        return convertToProfileDto(user);
    }

    @Override
    public List<UserProfileDto> getAllUsersDto() {
        return userRepository.findAll().stream()
                .map(this::convertToProfileDto)
                .collect(Collectors.toList());
    }

    @Override
    public UserProfileDto getUserByIdDto(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));
        return convertToProfileDto(user);
    }

    @Override
    @Transactional
    public UserProfileDto updateUserById(Long id, UserProfileDto userDto) {
        User existing = getUserById(id);

        existing.setFirstName(userDto.getFirstName());
        existing.setLastName(userDto.getLastName());
        existing.setPhoneNumber(userDto.getPhoneNumber());

        if (userDto.getGender() != null) {
            existing.setGender(Gender.valueOf(userDto.getGender()));
        }

        existing.setDob(userDto.getDob());
        existing.setPhotoUrl(userDto.getPhotoUrl());

        userRepository.save(existing);
        return convertToProfileDto(existing);
    }

    @Override
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found: " + id);
        }
        userRepository.deleteById(id);
    }

    @Override
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Override
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));
    }

    @Override
    @Transactional
    public User updateUser(Long id, User user) {
        User existing = getUserById(id);
        existing.setFirstName(user.getFirstName());
        existing.setLastName(user.getLastName());
        existing.setPhoneNumber(user.getPhoneNumber());
        existing.setRole(user.getRole());
        return userRepository.save(existing);
    }

    private UserProfileDto convertToProfileDto(User user) {
        return UserProfileDto.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .phoneNumber(user.getPhoneNumber())
                .gender(user.getGender() != null ? user.getGender().name() : null)
                .dob(user.getDob())
                .photoUrl(user.getPhotoUrl())
                .role(user.getRole() != null ? user.getRole().name() : null)
                .build();
    }
}