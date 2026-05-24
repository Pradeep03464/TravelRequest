package com.travel.backend.controller;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.travel.backend.entity.User;
import com.travel.backend.repository.TravelRequestRepository;
import com.travel.backend.repository.UserRepository;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/users")
public class UserController {
    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TravelRequestRepository travelRequestRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @GetMapping("/{id}/requests")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getUserRequests(@PathVariable Long id) {
        return ResponseEntity.ok(travelRequestRepository.findByEmployeeId(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody User update) {
        Optional<User> existing = userRepository.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.badRequest().body("User not found");
        }
        User user = existing.get();
        if (update.getName() != null) user.setName(update.getName());
        if (update.getEmail() != null) user.setEmail(update.getEmail());
        if (update.getRole() != null) user.setRole(update.getRole());
        
        // Allow updating password if provided (already hashed or to be hashed)
        if (update.getPassword() != null && !update.getPassword().isEmpty()) {
            // Check if it's already a bcrypt hash (starts with $2a$)
            if (!update.getPassword().startsWith("$2a$")) {
                user.setPassword(passwordEncoder.encode(update.getPassword()));
            } else {
                user.setPassword(update.getPassword());
            }
        }
        
        userRepository.save(user);
        return ResponseEntity.ok(user);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<?> createUser(@RequestBody User user) {
        logger.info("Attempting to create user with email: {}", user.getEmail());
        if (userRepository.existsByEmail(user.getEmail())) {
            logger.warn("User creation failed: Email {} already in use", user.getEmail());
            return ResponseEntity.badRequest().body("Email already in use");
        }
        // Encode password before saving
        if (user.getPassword() == null || user.getPassword().isEmpty()) {
            logger.error("User creation failed: Password is required");
            return ResponseEntity.badRequest().body("Password is required");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        userRepository.save(user);
        logger.info("Successfully created user: {}", user.getEmail());
        return ResponseEntity.ok(user);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            Optional<User> userOpt = userRepository.findById(id);
            if (userOpt.isEmpty()) {
                return ResponseEntity.badRequest().body("User not found");
            }
            
            User user = userOpt.get();
            // Using delete(user) instead of deleteById(id) ensures that 
            // JPA Cascading (CascadeType.ALL) is correctly triggered 
            // for all associated entities like TravelRequests.
            userRepository.delete(user);
            
            logger.info("Successfully deleted user with ID: {} and their associated data via cascading delete", id);
            return ResponseEntity.ok("User and associated requests deleted successfully");
        } catch (Exception e) {
            logger.error("Failed to delete user with ID: {}. Error: {}", id, e.getMessage(), e);
            return ResponseEntity.internalServerError().body("Failed to delete user: " + e.getMessage());
        }
    }
}
