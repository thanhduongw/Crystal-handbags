package iuh.fit.se.backend.service.impl;

import iuh.fit.se.backend.config.VNPayConfig;
import iuh.fit.se.backend.messaging.event.PaymentFailedEvent;
import iuh.fit.se.backend.messaging.event.PaymentSucceededEvent;
import iuh.fit.se.backend.messaging.publisher.MessagePublisher;
import iuh.fit.se.backend.model.*;
import iuh.fit.se.backend.repository.OrderRepository;
import iuh.fit.se.backend.repository.PaymentRepository;
import iuh.fit.se.backend.service.InventoryService;
import iuh.fit.se.backend.service.VNPayService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class VNPayServiceImpl implements VNPayService {

    private final VNPayConfig vnPayConfig;
    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final InventoryService inventoryService;
    private final MessagePublisher messagePublisher;

    @Override
    public String createPaymentUrl(Order order, Payment payment, String clientIp) {
        Map<String, String> params = new TreeMap<>();
        params.put("vnp_Version", vnPayConfig.getVersion());
        params.put("vnp_Command", vnPayConfig.getCommand());
        params.put("vnp_TmnCode", vnPayConfig.getTmnCode());
        params.put("vnp_Amount",
                payment.getAmount().multiply(java.math.BigDecimal.valueOf(100)).toBigInteger().toString());
        params.put("vnp_CurrCode", vnPayConfig.getCurrCode());
        params.put("vnp_TxnRef", payment.getTxnRef());
        params.put("vnp_OrderInfo", payment.getOrderInfo());
        params.put("vnp_OrderType", vnPayConfig.getOrderType());
        params.put("vnp_Locale", vnPayConfig.getLocale());
        params.put("vnp_ReturnUrl", vnPayConfig.getReturnUrl());
        params.put("vnp_IpAddr", clientIp);

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        LocalDateTime now = LocalDateTime.now();
        params.put("vnp_CreateDate", now.format(formatter));
        params.put("vnp_ExpireDate", now.plusMinutes(15).format(formatter));

        String query = buildQuery(params);
        String hashData = buildHashData(params);
        String secureHash = hmacSHA512(vnPayConfig.getHashSecret(), hashData);

        return vnPayConfig.getPayUrl() + "?" + query + "&vnp_SecureHash=" + secureHash;
    }

    // Tạo chuỗi query và chuỗi hash data từ params để tính chữ ký và tạo URL
    private String buildQuery(Map<String, String> params) {
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, String> entry : params.entrySet()) {
            if (entry.getValue() != null && !entry.getValue().isEmpty()) {
                sb.append(URLEncoder.encode(entry.getKey(), StandardCharsets.UTF_8));
                sb.append("=");
                sb.append(URLEncoder.encode(entry.getValue(), StandardCharsets.UTF_8));
                sb.append("&");
            }
        }
        if (sb.isEmpty())
            return "";
        sb.setLength(sb.length() - 1);
        return sb.toString();
    }

    // Tạo chuỗi dữ liệu để tạo chữ ký
    private String buildHashData(Map<String, String> params) {
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, String> entry : params.entrySet()) {
            if (entry.getValue() != null && !entry.getValue().isEmpty()) {
                sb.append(entry.getKey());
                sb.append("=");
                sb.append(URLEncoder.encode(entry.getValue(), StandardCharsets.UTF_8));
                sb.append("&");
            }
        }
        if (sb.isEmpty())
            return "";
        sb.setLength(sb.length() - 1);
        return sb.toString();
    }

    // Xử lý dữ liệu trả về sau khi khách hàng hoàn tất thanh toán và được chuyển
    // hướng về trang kết quả
    @Override
    @Transactional
    public Map<String, Object> handleReturn(Map<String, String> params) {
        Map<String, Object> result = new HashMap<>();

        boolean valid = verifySignature(params);
        result.put("validSignature", valid);

        String txnRef = params.get("vnp_TxnRef");
        String responseCode = params.get("vnp_ResponseCode");
        String transactionStatus = params.get("vnp_TransactionStatus");

        result.put("txnRef", txnRef);
        result.put("responseCode", responseCode);
        result.put("transactionStatus", transactionStatus);

        if (!valid)
            return result;

        Payment payment = paymentRepository.findByTxnRef(txnRef).orElse(null);
        if (payment == null)
            return result;

        if (payment.getStatus() == PaymentStatus.PENDING_PAYMENT) {
            Order order = payment.getOrder();

            payment.setResponseCode(responseCode);
            payment.setTransactionStatus(transactionStatus);
            payment.setTransactionNo(params.get("vnp_TransactionNo"));
            payment.setBankCode(params.get("vnp_BankCode"));

            if ("00".equals(responseCode) && "00".equals(transactionStatus)) {
                payment.setStatus(PaymentStatus.SUCCESS);
                payment.setPaymentDate(LocalDateTime.now());
                order.setStatus(OrderStatus.CONFIRMED);
                paymentRepository.save(payment);
                orderRepository.save(order);
                PaymentSucceededEvent event = buildPaymentSucceededEvent(payment);
                publishAfterCommit(() -> messagePublisher.publishPaymentSucceeded(event));
            } else {
                payment.setStatus(PaymentStatus.FAILED);
                restoreInventoryForCancelledOrder(order);
                order.setStatus(OrderStatus.CANCELLED);
                paymentRepository.save(payment);
                orderRepository.save(order);
                PaymentFailedEvent event = buildPaymentFailedEvent(payment);
                publishAfterCommit(() -> messagePublisher.publishPaymentFailed(event));
            }
        }

        return result;
    }

    // Xử lý thông báo IPN từ VNPay để cập nhật trạng thái đơn hàng và thanh toán BE
    @Override
    @Transactional
    public Map<String, String> handleIpn(Map<String, String> params) {
        Map<String, String> response = new HashMap<>();

        if (!verifySignature(params)) {
            response.put("RspCode", "97");
            response.put("Message", "Invalid signature");
            return response;
        }

        String txnRef = params.get("vnp_TxnRef");
        Payment payment = paymentRepository.findByTxnRef(txnRef)
                .orElse(null);

        if (payment == null) {
            response.put("RspCode", "01");
            response.put("Message", "Order not found");
            return response;
        }
        String amountParam = params.get("vnp_Amount");
        if (amountParam != null) {
            java.math.BigDecimal returnedAmount = new java.math.BigDecimal(amountParam)
                    .divide(java.math.BigDecimal.valueOf(100));

            if (payment.getAmount().compareTo(returnedAmount) != 0) {
                response.put("RspCode", "04");
                response.put("Message", "Invalid amount");
                return response;
            }
        }

        String responseCode = params.get("vnp_ResponseCode");
        String transactionStatus = params.get("vnp_TransactionStatus");

        if (payment.getStatus() == PaymentStatus.PENDING_PAYMENT) {
            payment.setResponseCode(responseCode);
            payment.setTransactionStatus(transactionStatus);
            payment.setTransactionNo(params.get("vnp_TransactionNo"));
            payment.setBankCode(params.get("vnp_BankCode"));

            Order order = payment.getOrder();

            if ("00".equals(responseCode) && "00".equals(transactionStatus)) {
                payment.setStatus(PaymentStatus.SUCCESS);
                payment.setPaymentDate(LocalDateTime.now());
                order.setStatus(OrderStatus.CONFIRMED);
                paymentRepository.save(payment);
                orderRepository.save(order);
                PaymentSucceededEvent event = buildPaymentSucceededEvent(payment);
                publishAfterCommit(() -> messagePublisher.publishPaymentSucceeded(event));
            } else {
                payment.setStatus(PaymentStatus.FAILED);
                restoreInventoryForCancelledOrder(order);
                order.setStatus(OrderStatus.CANCELLED);
                paymentRepository.save(payment);
                orderRepository.save(order);
                PaymentFailedEvent event = buildPaymentFailedEvent(payment);
                publishAfterCommit(() -> messagePublisher.publishPaymentFailed(event));
            }

            response.put("RspCode", "00");
            response.put("Message", "Confirm Success");
        } else {
            if (payment.getTransactionNo() == null) {
                payment.setResponseCode(responseCode);
                payment.setTransactionStatus(transactionStatus);
                payment.setTransactionNo(params.get("vnp_TransactionNo"));
                payment.setBankCode(params.get("vnp_BankCode"));
                paymentRepository.save(payment);
            }
            response.put("RspCode", "02");
            response.put("Message", "Order already confirmed");
        }
        return response;
    }

    private PaymentSucceededEvent buildPaymentSucceededEvent(Payment payment) {
        Order order = payment.getOrder();
        User user = order.getUser();

        return PaymentSucceededEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .orderId(payment.getOrder().getOrderId())
                .userId(user != null ? user.getUserId() : null)
                .email(user != null ? user.getEmail() : null)
                .createdAt(LocalDateTime.now())
                .paymentId(payment.getPaymentId())
                .txnRef(payment.getTxnRef())
                .transactionNo(payment.getTransactionNo())
                .responseCode(payment.getResponseCode())
                .amount(payment.getAmount())
                .build();
    }

    private PaymentFailedEvent buildPaymentFailedEvent(Payment payment) {
        Order order = payment.getOrder();
        User user = order.getUser();
        List<PaymentFailedEvent.InventoryLine> inventoryItems = order.getOrderItems().stream()
                .map(item -> PaymentFailedEvent.InventoryLine.builder()
                        .itemId(item.getProductItem().getItemId())
                        .quantity(item.getQuantity())
                        .build())
                .toList();

        return PaymentFailedEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .orderId(order.getOrderId())
                .userId(user != null ? user.getUserId() : null)
                .email(user != null ? user.getEmail() : null)
                .createdAt(LocalDateTime.now())
                .paymentId(payment.getPaymentId())
                .txnRef(payment.getTxnRef())
                .responseCode(payment.getResponseCode())
                .transactionStatus(payment.getTransactionStatus())
                .amount(payment.getAmount())
                .inventoryItems(inventoryItems)
                .build();
    }

    private void restoreInventoryForCancelledOrder(Order order) {
        if (order.getOrderItems() == null) {
            return;
        }

        for (OrderItem item : order.getOrderItems()) {
            if (item.getProductItem() == null
                    || item.getProductItem().getItemId() == null
                    || item.getQuantity() == null
                    || item.getQuantity() <= 0) {
                continue;
            }

            inventoryService.increaseStock(item.getProductItem().getItemId(), item.getQuantity());
        }
    }

    private void publishAfterCommit(Runnable action) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    action.run();
                }
            });
        } else {
            action.run();
        }
    }

    // Xác thực chữ ký trả về từ VNPay để đảm bảo dữ liệu không bị giả mạo
    @Override
    public boolean verifySignature(Map<String, String> params) {
        String vnpSecureHash = params.get("vnp_SecureHash");
        if (vnpSecureHash == null)
            return false;

        Map<String, String> filtered = new TreeMap<>(params);
        filtered.remove("vnp_SecureHash");
        filtered.remove("vnp_SecureHashType");

        String hashData = buildHashData(filtered);
        String calculatedHash = hmacSHA512(vnPayConfig.getHashSecret(), hashData);

        return calculatedHash.equalsIgnoreCase(vnpSecureHash);
    }

    // tạo chữ ký bảo mật
    private String hmacSHA512(String key, String data) {
        try {
            Mac hmac512 = Mac.getInstance("HmacSHA512");
            SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            hmac512.init(secretKey);
            byte[] bytes = hmac512.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hash = new StringBuilder();
            for (byte b : bytes) {
                hash.append(String.format("%02x", b));
            }
            return hash.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error while hashing", e);
        }
    }

}
