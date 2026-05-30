package iuh.fit.se.backend.messaging.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentSucceededEvent implements Serializable {
    private String eventId;
    private Long orderId;
    private Long userId;
    private String email;
    private LocalDateTime createdAt;
    private Long paymentId;
    private String txnRef;
    private String transactionNo;
    private String responseCode;
    private BigDecimal amount;
}
