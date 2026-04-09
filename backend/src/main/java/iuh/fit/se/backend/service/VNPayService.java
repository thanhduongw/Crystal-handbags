package iuh.fit.se.backend.service;

import iuh.fit.se.backend.model.Order;
import iuh.fit.se.backend.model.Payment;

import java.util.Map;

public interface VNPayService {
    String createPaymentUrl(Order order, Payment payment, String clientIp);
    boolean verifySignature(Map<String, String> params);
    Map<String, Object> handleReturn(Map<String, String> params);
    Map<String, String> handleIpn(Map<String, String> params);
}
