package iuh.fit.se.backend.controller;

import iuh.fit.se.backend.service.VNPayService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/api/payments/vnpay")
@RequiredArgsConstructor
public class PaymentController {

    private final VNPayService vnPayService;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @GetMapping("/return")
    public void vnpayReturn(@RequestParam Map<String, String> params,
                            HttpServletResponse response) throws IOException {

        vnPayService.handleReturn(params);

        String redirectUrl = frontendUrl.replaceAll("/+$", "") + "/payment-result"
                + "?txnRef=" + encodeParam(params.get("vnp_TxnRef"))
                + "&responseCode=" + encodeParam(params.get("vnp_ResponseCode"))
                + "&transactionStatus=" + encodeParam(params.get("vnp_TransactionStatus"));

        response.sendRedirect(redirectUrl);
    }

    @GetMapping("/ipn")
    public ResponseEntity<?> vnpayIpn(@RequestParam Map<String, String> params) {
        return ResponseEntity.ok(vnPayService.handleIpn(params));
    }

    private String encodeParam(String value) {
        return URLEncoder.encode(value == null ? "" : value, StandardCharsets.UTF_8);
    }
}
