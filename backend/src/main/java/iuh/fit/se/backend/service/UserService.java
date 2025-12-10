package iuh.fit.se.backend.service;

import iuh.fit.se.backend.dto.UserProfileDto;
import iuh.fit.se.backend.dto.auth.UserCreateRequest;
import iuh.fit.se.backend.dto.auth.UserCreateResponse;
import iuh.fit.se.backend.model.User;

import java.util.List;

public interface UserService {
    UserCreateResponse createUser(UserCreateRequest request);
    UserProfileDto getUserProfile(String email);
    UserProfileDto updateUserProfile(String email, UserProfileDto userProfileDto);
    List<User> getAllUsers();
    User getUserById(Long id);
    User updateUser(Long id, User user);
    void deleteUser(Long id);
    UserProfileDto updateUserById(Long id, UserProfileDto userDto);
    List<UserProfileDto> getAllUsersDto();
    UserProfileDto getUserByIdDto(Long id);
}
