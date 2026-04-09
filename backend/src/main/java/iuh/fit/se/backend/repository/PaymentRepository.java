package iuh.fit.se.backend.repository;

import iuh.fit.se.backend.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentRepository  extends JpaRepository<Payment, Long> {
        Optional<Payment> findByTxnRef(String txnRef);
        Optional<Payment> findByOrderOrderId(Long orderId);
}
