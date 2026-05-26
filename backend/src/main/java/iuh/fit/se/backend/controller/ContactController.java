package iuh.fit.se.backend.controller;

import iuh.fit.se.backend.dto.ContactRequest;
import iuh.fit.se.backend.service.EmailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
@RestController
@RequestMapping("/api/contact")
@RequiredArgsConstructor
public class ContactController {
    private final EmailService emailService;

    @Value("${app.contact.recipient:${spring.mail.username:}}")
    private String recipient;

    @PostMapping
    public ResponseEntity<Map<String, String>> sendContact(@Valid @RequestBody ContactRequest request) {
        if (recipient == null || recipient.isBlank()) {
            throw new IllegalStateException("Contact recipient email is not configured");
        }

        String subject = "New contact message from " + request.getName();
        String body = """
                Name: %s
                Email: %s
                Phone: %s

                Message:
                %s
                """.formatted(
                request.getName(),
                request.getEmail(),
                request.getPhone(),
                request.getMessage()
        );

        emailService.sendSimpleEmail(recipient, subject, body);
        return ResponseEntity.ok(Map.of("message", "Contact message sent successfully"));
    }
}
