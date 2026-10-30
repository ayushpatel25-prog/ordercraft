package com.ordercraft.service.impl;

import com.ordercraft.dto.auth.AuthResponse;
import com.ordercraft.dto.auth.LoginRequest;
import com.ordercraft.dto.auth.RegisterRequest;
import com.ordercraft.dto.user.UserDto;
import com.ordercraft.entity.Role;
import com.ordercraft.entity.User;
import com.ordercraft.exception.BusinessException;
import com.ordercraft.exception.ResourceNotFoundException;
import com.ordercraft.repository.RoleRepository;
import com.ordercraft.repository.UserRepository;
import com.ordercraft.security.JwtTokenProvider;
import com.ordercraft.security.UserPrincipal;
import com.ordercraft.service.AuditService;
import com.ordercraft.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuditService auditService;

    @Override
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail().trim(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        List<String> roles = principal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        auditService.log("USER_LOGIN", "User", principal.getEmail(), null, "Successful login");

        return AuthResponse.builder()
                .token(jwt)
                .tokenType("Bearer")
                .id(principal.getId())
                .name(principal.getName())
                .email(principal.getEmail())
                .roles(roles)
                .permissions(Collections.emptyList())
                .build();
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new BusinessException("Passwords do not match");
        }

        if (userRepository.existsByEmail(request.getEmail().trim())) {
            throw new BusinessException("An account with this email already exists: " + request.getEmail());
        }

        String roleName = (request.getRole() != null && !request.getRole().trim().isEmpty())
                ? request.getRole().trim().toUpperCase()
                : "SALES";

        Role userRole = roleRepository.findByName(roleName)
                .orElseGet(() -> roleRepository.findByName("SALES")
                        .orElseThrow(() -> new ResourceNotFoundException("Role", "name", roleName)));

        User user = User.builder()
                .name(request.getName().trim())
                .email(request.getEmail().trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .isActive(true)
                .roles(new HashSet<>(Collections.singletonList(userRole)))
                .build();

        User savedUser = userRepository.save(user);

        auditService.log("USER_REGISTERED", "User", savedUser.getEmail(), null, "Role: " + userRole.getName());

        LoginRequest loginReq = new LoginRequest(request.getEmail(), request.getPassword(), false);
        return login(loginReq);
    }

    @Override
    @Transactional(readOnly = true)
    public UserDto getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new BusinessException("No authenticated user");
        }

        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", auth.getName()));

        return toDto(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public UserDto updateUserStatus(Long userId, boolean active) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        boolean oldStatus = user.getIsActive();
        user.setIsActive(active);
        userRepository.save(user);

        auditService.log("USER_STATUS_CHANGED", "User", user.getEmail(), "Active: " + oldStatus, "Active: " + active);

        return toDto(user);
    }

    private UserDto toDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .isActive(user.getIsActive())
                .roles(user.getRoles().stream().map(Role::getName).collect(Collectors.toList()))
                .createdAt(user.getCreatedAt())
                .build();
    }
}
