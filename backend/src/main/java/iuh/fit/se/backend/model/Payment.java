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

    @Enumerated(EnumType.STRING)
    private PaymentStatus status;

    //VNPay
    @Column(unique = true)
    private String txnRef; // Mã giao dịch từ VNPay

    private String transactionNo; // Mã giao dịch VNPay trả về
    private String responseCode; // Mã phản hồi từ VNPay
    private String transactionStatus; // Trạng thái giao dịch từ VNPay
    private String bankCode; // Mã ngân hàng từ VNPay
    private String orderInfo; // Thông tin đơn hàng từ VNPay
}
