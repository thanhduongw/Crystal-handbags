package iuh.fit.se.backend.dto;

import lombok.Data;
import java.util.List;

@Data
public class CheckoutRequest {
    private Long addressId;
    private String paymentMethod;
    private List<Long> cartItemIds;
}