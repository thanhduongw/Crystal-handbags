package iuh.fit.se.backend.constants;

import java.math.BigDecimal;
import java.util.Locale;

public final class RedisKeyConstants {

    private RedisKeyConstants() {
    }

    public static final class Cache {
        public static final String PRODUCT_DETAIL = "product:detail";
        public static final String PRODUCT_LIST = "product:list";
        public static final String CATEGORY = "category";
        public static final String INVENTORY = "inventory";

        private Cache() {
        }
    }

    public static final class Prefix {
        public static final String INVENTORY_LOCK = "lock:inventory:";
        public static final String CART_USER = "cart:user:";
        public static final String CART_GUEST = "cart:guest:";
        public static final String OTP = "otp:";
        public static final String OTP_ATTEMPT = "otp:attempt:";
        public static final String OTP_RESEND = "otp:resend:";

        private Prefix() {
        }
    }

    public static String userCartKey(Long userId) {
        return Prefix.CART_USER + userId;
    }

    public static String guestCartKey(String sessionId) {
        return Prefix.CART_GUEST + normalize(sessionId);
    }

    public static String inventoryLockKey(Long variantId) {
        return Prefix.INVENTORY_LOCK + variantId;
    }

    public static String otpKey(String purpose, String destination) {
        return Prefix.OTP + otpPurposeSegment(purpose) + ":" + normalize(destination);
    }

    public static String otpAttemptKey(String purpose, String destination) {
        return Prefix.OTP_ATTEMPT + otpPurposeSegment(purpose) + ":" + normalize(destination);
    }

    public static String otpResendKey(String purpose, String destination) {
        return Prefix.OTP_RESEND + otpPurposeSegment(purpose) + ":" + normalize(destination);
    }

    public static String productSearchKey(String keyword) {
        return "search:" + normalize(keyword);
    }

    public static String productCategoryKey(Long categoryId) {
        return "category:" + categoryId;
    }

    public static String productFilterKey(
            String keyword,
            Long categoryId,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String color,
            String size,
            Integer page,
            Integer pageSize) {

        return String.join(":",
                "filter",
                normalize(keyword),
                String.valueOf(categoryId),
                minPrice != null ? minPrice.stripTrailingZeros().toPlainString() : "null",
                maxPrice != null ? maxPrice.stripTrailingZeros().toPlainString() : "null",
                normalize(color),
                normalize(size),
                String.valueOf(page),
                String.valueOf(pageSize));
    }

    private static String otpPurposeSegment(String purpose) {
        if (purpose == null) {
            return "general";
        }
        return switch (purpose.trim().toUpperCase(Locale.ROOT)) {
            case "REGISTER" -> "register";
            case "RESET_PASSWORD", "FORGOT_PASSWORD" -> "forgot-password";
            case "PHONE" -> "phone";
            default -> purpose.trim().toLowerCase(Locale.ROOT).replace("_", "-");
        };
    }

    private static String normalize(String value) {
        return value == null || value.isBlank()
                ? "all"
                : value.trim().toLowerCase(Locale.ROOT);
    }
}
