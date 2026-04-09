package iuh.fit.se.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class CheckoutResponse {
    private Long orderId;
    private String paymentMethod;
    private String paymentStatus;
    private String orderStatus;
    private String paymentUrl;
}
