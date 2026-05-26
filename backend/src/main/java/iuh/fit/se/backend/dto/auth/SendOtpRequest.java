package iuh.fit.se.backend.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class SendOtpRequest {
    @Email
    @NotBlank
    private String email;

    @NotBlank
    @Pattern(regexp = "REGISTER|RESET_PASSWORD|LOGIN_2FA")
    private String purpose;
}
