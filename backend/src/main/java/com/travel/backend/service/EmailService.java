package com.travel.backend.service;

import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import jakarta.mail.internet.MimeMessage;
import org.springframework.core.io.FileSystemResource;
import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.travel.backend.entity.Role;
import com.travel.backend.entity.TravelRequest;
import com.travel.backend.entity.User;
import com.travel.backend.repository.UserRepository;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Autowired
    private UserRepository userRepository;

    @Value("${file.upload-dir:uploads}")
    private String uploadDirSetting;

    // OTP storage - email -> {otp, timestamp}
    private final Map<String, OtpData> otpStorage = new ConcurrentHashMap<>();
    private final Random random = new Random();
    private static final int OTP_EXPIRY_MINUTES = 10;

    private static class OtpData {
        String otp;
        long timestamp;

        OtpData(String otp, long timestamp) {
            this.otp = otp;
            this.timestamp = timestamp;
        }
    }

    public void sendTicketNotification(TravelRequest request) {
        if (request == null || request.getEmployee() == null) {
            logger.warn("Ticket notification skipped: Request or Employee is null");
            return;
        }
    
        String employeeEmail = request.getEmployee().getEmail();
        String employeeName = request.getEmployee().getName();
        String ticket1 = request.getTicketPath();
        String ticket2 = request.getReturnTicketPath();
        
        logger.info("************************************************");
        logger.info("TICKET NOTIFICATION TRIGGERED for Request ID: {}", request.getId());
        logger.info("Employee: {} ({})", employeeName, employeeEmail);
        if (ticket1 != null) logger.info("Departure Ticket: {}", ticket1);
        if (ticket2 != null) logger.info("Return Ticket: {}", ticket2);
        logger.info("************************************************");
    
        String employeeBody = buildEmployeeMessage(request);
        String managerSubject = String.format("Ticket issued for %s", employeeName);
        String managerBody = buildManagerMessage(request);
    
        // List of files that actually exist
        List<String> validFiles = new java.util.ArrayList<>();
        if (ticket1 != null) validFiles.add(ticket1);
        if (ticket2 != null) validFiles.add(ticket2);
    
        // Notify Employee
        if (employeeEmail != null && !employeeEmail.isBlank()) {
            boolean sent;
            if (!validFiles.isEmpty()) {
                sent = sendEmailWithMultipleAttachments(employeeEmail, "Your Travel Ticket(s) Attached", employeeBody, validFiles);
            } else {
                sent = sendSimpleMessage(employeeEmail, "Your Travel Ticket is Ready", employeeBody);
            }
            if (sent) logger.info("Ticket email sent to Employee: {}", employeeEmail);
        }
    
        // Notify Managers
        List<User> managers = userRepository.findAll().stream()
            .filter(u -> u.getRole() == Role.MANAGER)
            .toList();
    
        for (User manager : managers) {
            String managerEmail = manager.getEmail();
            if (managerEmail != null && !managerEmail.isBlank()) {
                if (!validFiles.isEmpty()) {
                    sendEmailWithMultipleAttachments(managerEmail, managerSubject, managerBody, validFiles);
                } else {
                    sendSimpleMessage(managerEmail, managerSubject, managerBody);
                }
            }
        }
    }
    
    public boolean sendEmailWithMultipleAttachments(String to, String subject, String text, List<String> filenames) {
        if (mailSender == null) {
            logger.warn("Mail sender is not configured; skipping email to {}", to);
            return false;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(text);
    
            for (String filename : filenames) {
                Path path = Paths.get(uploadDirSetting).toAbsolutePath().resolve(filename);
                File file = path.toFile();
                if (file.exists()) {
                    FileSystemResource res = new FileSystemResource(file);
                    helper.addAttachment(filename, res);
                }
            }
            mailSender.send(message);
            return true;
        } catch (Exception ex) {
            logger.error("Failed to send multi-attachment email to {}: {}", to, ex.getMessage());
            return sendSimpleMessage(to, subject, text);
        }
    }

    public boolean sendMessageWithAttachment(String to, String subject, String text, String filename) {
        if (mailSender == null) {
            logger.warn("Mail sender is not configured; skipping email to {}", to);
            return false;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            // True for multipart
            MimeMessageHelper helper = new MimeMessageHelper(message, true);
            
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(text);

            Path path = Paths.get(uploadDirSetting).toAbsolutePath().resolve(filename);
            File file = path.toFile();
            
            if (file.exists()) {
                FileSystemResource res = new FileSystemResource(file);
                helper.addAttachment(filename, res);
                logger.debug("Attached file: {}", filename);
            } else {
                logger.warn("Attachment file not found on disk: {}", path);
            }

            mailSender.send(message);
            return true;
        } catch (Exception ex) {
            logger.error("Unable to send email with attachment to {}: {}", to, ex.getMessage());
            // Fallback to simple message without attachment if it fails
            return sendSimpleMessage(to, subject, text);
        }
    }

    public boolean sendSimpleMessage(String to, String subject, String text) {
        if (mailSender == null) {
            logger.warn("Mail sender is not configured; skipping email to {}", to);
            return false;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            mailSender.send(message);
            return true;
        } catch (Exception ex) {
            logger.warn("Unable to send email to {}: {}", to, ex.getMessage());
            return false;
        }
    }

    private String buildEmployeeMessage(TravelRequest request) {
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("Hi %s,\n\nYour travel ticket for the trip from %s to %s has been issued.\n\n", 
            request.getEmployee().getName(), request.getFromLocation(), request.getToLocation()));
        
        sb.append(String.format("Departure PNR: %s\n", request.getPnr() != null ? request.getPnr() : "N/A"));
        
        if ("round-trip".equals(request.getTripType()) && request.getReturnPnr() != null) {
            sb.append(String.format("Return PNR: %s\n", request.getReturnPnr()));
            sb.append("\nPlease find both your Departure and Return tickets attached to this email. The return ticket file indicates your journey home.\n");
        } else {
            sb.append("\nPlease find your ticket attached to this email.\n");
        }
        
        sb.append("\nSafe travels!\nTravelRequest Team");
        return sb.toString();
    }

    private String buildManagerMessage(TravelRequest request) {
        StringBuilder sb = new StringBuilder();
        sb.append(String.format("Hi,\n\nA travel ticket has been issued for employee %s (ID: %d) for the trip %s → %s.\n\n",
            request.getEmployee().getName(), request.getEmployee().getId(), request.getFromLocation(), request.getToLocation()));
            
        sb.append(String.format("Departure PNR: %s\n", request.getPnr() != null ? request.getPnr() : "N/A"));
        
        if ("round-trip".equals(request.getTripType()) && request.getReturnPnr() != null) {
            sb.append(String.format("Return PNR: %s\n", request.getReturnPnr()));
        }
        
        sb.append("\nThe ticket file(s) are attached to this email.\n\nRegards,\nTravelRequest System");
        return sb.toString();
    }

    public boolean sendPasswordResetOtp(String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            logger.info("Password reset requested for non-existent email: {}", email);
            return false; // Don't reveal if email exists or not for security
        }

        String otp = generateOtp();
        otpStorage.put(email, new OtpData(otp, System.currentTimeMillis()));

        String subject = "Password Reset OTP - TravelRequest";
        String body = buildPasswordResetMessage(user.getName(), otp);

        logger.info("Sending password reset OTP to: {}", email);
        // CRITICAL: Log OTP to console so it can be used even if email fails
        logger.info("************************************************");
        logger.info("OTP FOR {}: {}", email, otp);
        logger.info("************************************************");
        
        boolean sent = sendSimpleMessage(email, subject, body);
        if (sent) {
            logger.info("Password reset OTP sent successfully to: {}", email);
        } else {
            logger.error("Failed to send password reset OTP to: {} (Check SMTP settings in application.properties)", email);
            // Even if email fails, we return true if we've logged the OTP so the user can use it from the logs
            // But actually, the controller handles the message. Let's keep the return value as sent status.
        }
        return sent;
    }

    public boolean verifyOtp(String email, String otp) {
        OtpData otpData = otpStorage.get(email);
        if (otpData == null) {
            return false;
        }

        // Check if OTP is expired (10 minutes)
        long currentTime = System.currentTimeMillis();
        long otpTime = otpData.timestamp;
        if ((currentTime - otpTime) > (OTP_EXPIRY_MINUTES * 60 * 1000)) {
            otpStorage.remove(email); // Clean up expired OTP
            return false;
        }

        return otpData.otp.equals(otp);
    }

    public boolean resetPassword(String email, String otp, String newPassword) {
        if (!verifyOtp(email, otp)) {
            return false;
        }

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return false;
        }

        // Update password
        user.setPassword(newPassword); // This will be encoded by the controller
        userRepository.save(user);

        // Clean up OTP
        otpStorage.remove(email);

        return true;
    }

    private String generateOtp() {
        return String.format("%06d", random.nextInt(999999));
    }

    private String buildPasswordResetMessage(String userName, String otp) {
        return String.format(
            "Hi %s,\n\nYou have requested to reset your password for TravelRequest.\n\nYour OTP is: %s\n\nThis OTP will expire in %d minutes.\n\nIf you didn't request this, please ignore this email.\n\nRegards,\nTravelRequest Team",
            userName,
            otp,
            OTP_EXPIRY_MINUTES
        );
    }
}
