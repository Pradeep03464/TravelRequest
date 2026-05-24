package com.travel.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.travel.backend.entity.Role;
import com.travel.backend.entity.User;
import com.travel.backend.payload.request.LoginRequest;
import com.travel.backend.payload.request.SignupRequest;
import com.travel.backend.payload.response.JwtResponse;
import com.travel.backend.payload.response.MessageResponse;
import com.travel.backend.repository.UserRepository;
import com.travel.backend.security.jwt.JwtUtils;
import com.travel.backend.security.services.UserDetailsImpl;
import com.travel.backend.service.EmailService;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @Autowired
    EmailService emailService;

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        String role = userDetails.getAuthorities().iterator().next().getAuthority();

        return ResponseEntity.ok(new JwtResponse(jwt,
                userDetails.getId(),
                userDetails.getName(),
                userDetails.getUsername(),
                role));
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@RequestBody SignupRequest signUpRequest) {
        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Email is already in use!"));
        }

        Role userRole = Role.EMPLOYEE;
        if (signUpRequest.getRole() != null) {
            try {
                userRole = Role.valueOf(signUpRequest.getRole().toUpperCase());
            } catch (Exception e) {}
        }

        User user = new User(signUpRequest.getName(),
                signUpRequest.getEmail(),
                encoder.encode(signUpRequest.getPassword()),
                userRole);

        userRepository.save(user);

        return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody java.util.Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Email is required"));
        }

        boolean sent = emailService.sendPasswordResetOtp(email);
        // Always return success for security (don't reveal if email exists)
        return ResponseEntity.ok(new MessageResponse("If the email exists, an OTP has been sent"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody java.util.Map<String, String> request) {
        String email = request.get("email");
        String otp = request.get("otp");
        String newPassword = request.get("newPassword");

        if (email == null || otp == null || newPassword == null) {
            return ResponseEntity.badRequest().body(new MessageResponse("Email, OTP, and new password are required"));
        }

        if (newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(new MessageResponse("Password must be at least 6 characters"));
        }

        // First verify OTP
        if (!emailService.verifyOtp(email, otp)) {
            return ResponseEntity.badRequest().body(new MessageResponse("Invalid or expired OTP"));
        }

        // Reset password
        String encodedPassword = encoder.encode(newPassword);
        boolean success = emailService.resetPassword(email, otp, encodedPassword);

        if (success) {
            return ResponseEntity.ok(new MessageResponse("Password reset successfully"));
        } else {
            return ResponseEntity.badRequest().body(new MessageResponse("Failed to reset password"));
        }
    }

    @PostMapping("/test-email")
    public ResponseEntity<?> testEmail(@RequestBody java.util.Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Email is required"));
        }

        try {
            // Send a test email
            emailService.sendSimpleMessage(email, "Test Email - TravelRequest", "This is a test email from TravelRequest system.\n\nIf you received this, email configuration is working!");
            return ResponseEntity.ok(new MessageResponse("Test email sent successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new MessageResponse("Failed to send test email: " + e.getMessage()));
        }
    }
}
