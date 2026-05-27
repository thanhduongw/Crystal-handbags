package iuh.fit.se.backend;

import iuh.fit.se.backend.service.OrderService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

@SpringBootTest
@ActiveProfiles("test")
class AdminOrdersSmokeTest {

    @Autowired
    private OrderService orderService;

    @Test
    void getAllOrdersDoesNotFailOnPersistedPaymentRows() {
        assertDoesNotThrow(() -> orderService.getAllOrders());
    }
}
