package iuh.fit.se.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long paymentId;

    @OneToOne
    @JoinColumn(name = "order_id")
    private Order order;

    private BigDecimal amount;
    private LocalDateTime paymentDate;

    @Enumerated(EnumType.STRING)
    private PaymentMethod paymentMethod;

    private Boolean status;
}
