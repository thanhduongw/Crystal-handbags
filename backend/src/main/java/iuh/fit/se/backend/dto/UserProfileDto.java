package iuh.fit.se.backend.dto;

import lombok.*;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileDto {
    private String email;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private String gender;
    private LocalDate dob;
    private String photoUrl;
}