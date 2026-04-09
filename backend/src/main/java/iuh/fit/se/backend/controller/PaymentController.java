package iuh.fit.se.backend.controller;

import iuh.fit.se.backend.service.VNPayService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/payments/vnpay")
@RequiredArgsConstructor
public class PaymentController {

    private final VNPayService vnPayService;

    @GetMapping("/return")
    public void vnpayReturn(@RequestParam Map<String, String> params,
                            HttpServletResponse response) throws IOException {

        vnPayService.handleReturn(params);

        String redirectUrl = "http://localhost:5173/payment-result"
                + "?txnRef=" + params.get("vnp_TxnRef")
                + "&responseCode=" + params.get("vnp_ResponseCode")
                + "&transactionStatus=" + params.get("vnp_TransactionStatus");

        response.sendRedirect(redirectUrl);
    }

    @GetMapping("/ipn")
    public ResponseEntity<?> vnpayIpn(@RequestParam Map<String, String> params) {
        return ResponseEntity.ok(vnPayService.handleIpn(params));
    }
}