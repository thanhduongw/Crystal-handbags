package iuh.fit.se.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "address")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Address {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long addressId;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private String fullName;
    private String phoneNumber;
    private String street;
    private String ward;
    private String district;
    private String province;
    private Boolean isDefault;
}
