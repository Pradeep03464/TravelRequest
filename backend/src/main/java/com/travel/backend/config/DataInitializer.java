package com.travel.backend.config;

import com.travel.backend.entity.Role;
import com.travel.backend.entity.User;
import com.travel.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initData(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (userRepository.count() == 0) {
                // Create Admin
                userRepository.save(new User(
                        "Admin User",
                        "admin@gmail.com",
                        passwordEncoder.encode("admin123"),
                        Role.ADMIN));

                // Create Manager
                userRepository.save(new User(
                        "Manager User",
                        "vikastotiger2003+manager@gmail.com",
                        passwordEncoder.encode("manager123"),
                        Role.MANAGER));

                // Create Default Employee
                userRepository.save(new User(
                        "Test Employee",
                        "vikastotiger2003+employee@gmail.com",
                        passwordEncoder.encode("password"),
                        Role.EMPLOYEE));
                
                // USER'S MAIN ACCOUNT - Elevate to ADMIN for full project control
                if (!userRepository.existsByEmail("vikastotiger2003@gmail.com")) {
                    userRepository.save(new User(
                            "Vikas",
                            "vikastotiger2003@gmail.com",
                            passwordEncoder.encode("vikas123"),
                            Role.ADMIN));
                }

                System.out.println("Database Initialized with default users.");
            }
        };
    }
}
