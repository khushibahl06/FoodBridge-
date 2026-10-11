
package com.surplusfood.fooddonationbackend.controller;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.surplusfood.fooddonationbackend.entity.User;
import com.surplusfood.fooddonationbackend.repository.UserRepository;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = {
    "http://localhost:5173",
    "http://localhost:5174",
    "https://food-bridge-eight-sigma.vercel.app"
})
public class UserController {

    private final UserRepository userRepository;

    private final BCryptPasswordEncoder passwordEncoder =
        new BCryptPasswordEncoder();

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    // Check whether a password is BCrypt-hashed.
    private boolean isBCryptPassword(String password) {
    return password != null
        && password.matches("^\\$2[aby]\\$\\d{2}\\$.{53}$");
}

    // Verify BCrypt passwords and legacy plain-text passwords.
    private boolean passwordMatches(
            String rawPassword, String storedPassword) {

        if (rawPassword == null || storedPassword == null) {
            return false;
        }

        try {
            if (isBCryptPassword(storedPassword)) {
                return passwordEncoder.matches(
                    rawPassword, storedPassword
                );
            }

            return storedPassword.equals(rawPassword);

        } catch (IllegalArgumentException exception) {
            return false;
        }
    }

    // Get all users without exposing passwords.
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {

        List<User> users = userRepository.findAll();

        users.forEach(user -> user.setPassword(null));

        return ResponseEntity.ok(users);
    }

    // Register a restaurant, NGO, or volunteer.
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {

        if (user.getName() == null
                || user.getName().trim().isEmpty()
                || user.getEmail() == null
                || user.getEmail().trim().isEmpty()
                || user.getPhone() == null
                || user.getPhone().trim().isEmpty()
                || user.getPassword() == null
                || user.getPassword().isEmpty()
                || user.getRole() == null) {

            return ResponseEntity.badRequest().body(
                Map.of("message",
                    "Please fill in all required fields.")
            );
        }

        String name = user.getName().trim();
        String email = user.getEmail().trim();
        String role = user.getRole().trim().toUpperCase();

        if (!Arrays.asList(
                "RESTAURANT", "NGO", "VOLUNTEER"
            ).contains(role)) {

            return ResponseEntity.badRequest().body(
                Map.of("message", "Invalid registration type.")
            );
        }

        if (userRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(
                Map.of("message", "Email already registered.")
            );
        }

        user.setName(name);
        user.setEmail(email);
        user.setRole(role);
        user.setPassword(
            passwordEncoder.encode(user.getPassword())
        );

        User savedUser = userRepository.save(user);

        savedUser.setPassword(null);

        return ResponseEntity.status(HttpStatus.CREATED).body(
            Map.of(
                "message",
                "Registration successful! You can now log in.",
                "user",
                savedUser
            )
        );
    }

    // Login an existing user.
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User loginUser) {

        if (loginUser.getEmail() == null
                || loginUser.getEmail().trim().isEmpty()
                || loginUser.getPassword() == null
                || loginUser.getPassword().isEmpty()) {

            return ResponseEntity.badRequest().body(
                Map.of("message",
                    "Email and password are required.")
            );
        }

        String email = loginUser.getEmail().trim();

        Optional<User> optionalUser =
            userRepository.findByEmail(email);

        // Temporary diagnostic: do not print passwords or hashes.
        if (optionalUser.isEmpty()) {
            System.out.println(
                "LOGIN DEBUG: User not found for submitted email."
            );

            return ResponseEntity.status(
                HttpStatus.UNAUTHORIZED
            ).body(
                Map.of("message", "Invalid email or password.")
            );
        }

        User user = optionalUser.get();

        System.out.println("LOGIN DEBUG: User found.");
        System.out.println(
            "LOGIN DEBUG: Role = " + user.getRole()
        );
        System.out.println(
            "LOGIN DEBUG: Password hash length = "
                + (user.getPassword() == null
                    ? 0 : user.getPassword().length())
        );

        boolean matches = passwordMatches(
            loginUser.getPassword(),
            user.getPassword()
        );

        System.out.println(
            "LOGIN DEBUG: Password matches = " + matches
        );

        if (!matches) {
            return ResponseEntity.status(
                HttpStatus.UNAUTHORIZED
            ).body(
                Map.of("message", "Invalid email or password.")
            );
        }

        // Upgrade legacy plain-text passwords after successful login.
        if (!isBCryptPassword(user.getPassword())) {
            user.setPassword(
                passwordEncoder.encode(loginUser.getPassword())
            );
            userRepository.save(user);
        }

        Map<String, Object> response = new HashMap<>();

        response.put("message", "Login successful.");
        response.put("id", user.getId());
        response.put("name", user.getName());
        response.put("email", user.getEmail());
        response.put(
            "phone",
            user.getPhone() == null ? "" : user.getPhone()
        );
        response.put(
            "address",
            user.getAddress() == null ? "" : user.getAddress()
        );
        response.put("role", user.getRole());

        return ResponseEntity.ok(response);
    }

    // Update profile details.
    @PutMapping("/{id}/profile")
    public ResponseEntity<?> updateProfile(
            @PathVariable Long id,
            @RequestBody User profileData) {

        Optional<User> optionalUser =
            userRepository.findById(id);

        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(
                HttpStatus.NOT_FOUND
            ).body(
                Map.of("message", "User not found.")
            );
        }

        if (profileData.getName() == null
                || profileData.getName().trim().isEmpty()
                || profileData.getEmail() == null
                || profileData.getEmail().trim().isEmpty()) {

            return ResponseEntity.badRequest().body(
                Map.of("message",
                    "Name and email are required.")
            );
        }

        User user = optionalUser.get();
        String newEmail = profileData.getEmail().trim();

        Optional<User> existingEmail =
            userRepository.findByEmail(newEmail);

        if (existingEmail.isPresent()
                && !existingEmail.get().getId().equals(id)) {

            return ResponseEntity.status(
                HttpStatus.CONFLICT
            ).body(
                Map.of("message",
                    "That email is already in use.")
            );
        }

        user.setName(profileData.getName().trim());
        user.setEmail(newEmail);
        user.setPhone(profileData.getPhone());
        user.setAddress(profileData.getAddress());

        User savedUser = userRepository.save(user);

        Map<String, Object> response = new HashMap<>();

        response.put("message",
            "Profile updated successfully.");
        response.put("id", savedUser.getId());
        response.put("name", savedUser.getName());
        response.put("email", savedUser.getEmail());
        response.put(
            "phone",
            savedUser.getPhone() == null
                ? "" : savedUser.getPhone()
        );
        response.put(
            "address",
            savedUser.getAddress() == null
                ? "" : savedUser.getAddress()
        );
        response.put("role", savedUser.getRole());

        return ResponseEntity.ok(response);
    }

    // Change password after checking the current password.
    @PutMapping("/{id}/password")
    public ResponseEntity<?> changePassword(
            @PathVariable Long id,
            @RequestBody Map<String, String> passwordData) {

        String currentPassword =
            passwordData.get("currentPassword");
        String newPassword =
            passwordData.get("newPassword");
        String confirmPassword =
            passwordData.get("confirmPassword");

        if (currentPassword == null
                || currentPassword.isEmpty()
                || newPassword == null
                || newPassword.isEmpty()
                || confirmPassword == null
                || confirmPassword.isEmpty()) {

            return ResponseEntity.badRequest().body(
                Map.of("message",
                    "Please fill in all password fields.")
            );
        }

        if (newPassword.length() < 8) {
            return ResponseEntity.badRequest().body(
                Map.of("message",
                    "New password must contain at least 8 characters.")
            );
        }

        if (!newPassword.equals(confirmPassword)) {
            return ResponseEntity.badRequest().body(
                Map.of("message",
                    "New password and confirmation do not match.")
            );
        }

        if (currentPassword.equals(newPassword)) {
            return ResponseEntity.badRequest().body(
                Map.of("message",
                    "New password must differ from the current password.")
            );
        }

        Optional<User> optionalUser =
            userRepository.findById(id);

        if (optionalUser.isEmpty()) {
            return ResponseEntity.status(
                HttpStatus.NOT_FOUND
            ).body(
                Map.of("message", "User not found.")
            );
        }

        User user = optionalUser.get();

        if (!passwordMatches(
                currentPassword, user.getPassword())) {

            return ResponseEntity.status(
                HttpStatus.UNAUTHORIZED
            ).body(
                Map.of("message",
                    "Current password is incorrect.")
            );
        }

        user.setPassword(
            passwordEncoder.encode(newPassword)
        );

        userRepository.save(user);

        return ResponseEntity.ok(
            Map.of("message",
                "Password changed successfully.")
        );
    }
}
