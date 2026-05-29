package iuh.fit.se.backend.service.impl;

import iuh.fit.se.backend.dto.UserProfileDto;
import iuh.fit.se.backend.dto.auth.UserCreateRequest;
import iuh.fit.se.backend.dto.auth.UserCreateResponse;
import iuh.fit.se.backend.model.Gender;
import iuh.fit.se.backend.model.Role;
import iuh.fit.se.backend.model.User;
import iuh.fit.se.backend.repository.RoleRepository;
import iuh.fit.se.backend.repository.UserRepository;
import iuh.fit.se.backend.service.FileUploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements iuh.fit.se.backend.service.UserService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final FileUploadService fileUploadService;

    @Override
    public UserCreateResponse createUser(UserCreateRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

        Set<Role> roles = resolveRoles(request.getRoles());

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phoneNumber(request.getPhoneNumber())
                .roles(roles)
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

        if (userDto.getRoles() != null && !userDto.getRoles().isEmpty()) {
            Set<Role> roles = roleRepository.findByNameIn(userDto.getRoles());
            existing.setRoles(roles);
        }

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
        if (user.getRoles() != null && !user.getRoles().isEmpty()) {
            existing.setRoles(user.getRoles());
        }
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
                .roles(user.getRoles() != null
                        ? user.getRoles().stream().map(Role::getName).collect(Collectors.toSet())
                        : null)
                .build();
    }

    private Set<Role> resolveRoles(Set<String> roleNames) {
        Set<String> normalized = roleNames == null || roleNames.isEmpty()
                ? Set.of("CUSTOMER")
                : roleNames.stream()
                .filter(name -> name != null && !name.isBlank())
                .map(name -> name.replace("ROLE_", "").toUpperCase())
                .collect(Collectors.toSet());

        if (normalized.isEmpty()) {
            normalized = Set.of("CUSTOMER");
        }

        Set<Role> roles = roleRepository.findByNameIn(normalized);
        if (roles.size() != normalized.size()) {
            throw new RuntimeException("Invalid role provided");
        }
        return roles;
    }

    @Override
    @Transactional
    public UserProfileDto uploadMyAvatar(String email, MultipartFile image) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return replaceUserAvatar(user, image);
    }

    @Override
    @Transactional
    public UserProfileDto deleteMyAvatar(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return clearUserAvatar(user);
    }

    @Override
    @Transactional
    public UserProfileDto uploadUserAvatarById(Long id, MultipartFile image) {
        User user = getUserById(id);
        return replaceUserAvatar(user, image);
    }

    @Override
    @Transactional
    public UserProfileDto deleteUserAvatarById(Long id) {
        User user = getUserById(id);
        return clearUserAvatar(user);
    }

    private UserProfileDto replaceUserAvatar(User user, MultipartFile image) {
        String oldPhotoUrl = user.getPhotoUrl();

        String imageUrl = fileUploadService.uploadImage(
                image,
                "users/" + user.getUserId() + "/avatar"
        );

        user.setPhotoUrl(imageUrl);
        userRepository.save(user);

        if (oldPhotoUrl != null && !oldPhotoUrl.isBlank()) {
            try {
                fileUploadService.deleteImage(oldPhotoUrl);
            } catch (Exception ignored) {
                // Upload ảnh mới và lưu DB đã thành công.
                // Nếu xóa ảnh cũ thất bại thì không làm fail cập nhật avatar.
            }
        }

        return convertToProfileDto(user);
    }

    private UserProfileDto clearUserAvatar(User user) {
        deleteCurrentAvatarIfExists(user);

        user.setPhotoUrl(null);
        userRepository.save(user);

        return convertToProfileDto(user);
    }

    private void deleteCurrentAvatarIfExists(User user) {
        if (user.getPhotoUrl() == null || user.getPhotoUrl().isBlank()) {
            return;
        }

        try {
            fileUploadService.deleteImage(user.getPhotoUrl());
        } catch (Exception ignored) {
            // Nếu ảnh cũ không thuộc S3 của mình hoặc xóa thất bại,
            // vẫn cho cập nhật DB để user quay về avatar mặc định.
        }
    }
}
