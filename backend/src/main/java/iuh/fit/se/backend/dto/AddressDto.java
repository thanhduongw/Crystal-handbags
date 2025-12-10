package iuh.fit.se.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class AddressDto {
    Long addressId;
    String fullName;
    String phoneNumber;
    String street;
    String ward;
    String district;
    String province;
    Boolean isDefault;
}
