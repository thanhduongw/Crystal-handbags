package iuh.fit.se.backend.messaging;

import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentResultMessage implements Serializable {
    private Long orderId;
    private String txnRef;
    private boolean success;
    private String responseCode;
    private String customerEmail;
    private BigDecimal amount;
}
