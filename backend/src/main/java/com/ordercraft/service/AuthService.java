package com.ordercraft.service;

import com.ordercraft.dto.auth.AuthResponse;
import com.ordercraft.dto.auth.LoginRequest;
import com.ordercraft.dto.auth.RegisterRequest;
import com.ordercraft.dto.user.UserDto;

import java.util.List;

public interface AuthService {
    AuthResponse login(LoginRequest request);
    AuthResponse register(RegisterRequest request);
    UserDto getCurrentUser();
    List<UserDto> getAllUsers();
    UserDto updateUserStatus(Long userId, boolean active);
}
