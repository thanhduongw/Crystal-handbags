package iuh.fit.se.backend.dto;

import iuh.fit.se.backend.model.PaymentMethod;
import lombok.Data;
import java.util.List;

@Data
public class CheckoutRequest {
    private Long addressId;
    private PaymentMethod paymentMethod;
    private List<Long> cartItemIds;
}