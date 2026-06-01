package iuh.fit.se.backend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ServerRateLimitFilter extends OncePerRequestFilter {

    private static final long WINDOW_MILLIS = Duration.ofMinutes(1).toMillis();

    @Value("${app.rate-limit.enabled:true}")
    private boolean enabled;

    @Value("${app.rate-limit.requests-per-minute:120}")
    private int requestsPerMinute;

    private final Map<String, RequestCounter> counters = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if (!enabled || requestsPerMinute <= 0 || shouldSkip(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        long now = System.currentTimeMillis();
        String key = resolveClientIp(request);
        RequestCounter counter = counters.computeIfAbsent(key, ignored -> new RequestCounter(now));

        int remaining;
        long retryAfterSeconds = 0;
        boolean allowed;

        synchronized (counter) {
            if (now - counter.windowStartedAt >= WINDOW_MILLIS) {
                counter.windowStartedAt = now;
                counter.count = 0;
            }

            allowed = counter.count < requestsPerMinute;
            if (allowed) {
                counter.count++;
            } else {
                retryAfterSeconds = Math.max(1, (WINDOW_MILLIS - (now - counter.windowStartedAt) + 999) / 1000);
            }

            remaining = Math.max(0, requestsPerMinute - counter.count);
        }

        cleanupExpiredCounters(now);
        response.setHeader("X-RateLimit-Limit", String.valueOf(requestsPerMinute));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(remaining));

        if (!allowed) {
            response.setStatus(429);
            response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"status\":429,\"message\":\"Too many requests. Please try again later.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean shouldSkip(HttpServletRequest request) {
        return "OPTIONS".equalsIgnoreCase(request.getMethod())
                || !request.getRequestURI().startsWith("/api/");
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private void cleanupExpiredCounters(long now) {
        counters.entrySet().removeIf(entry -> now - entry.getValue().windowStartedAt >= WINDOW_MILLIS * 2);
    }

    private static class RequestCounter {
        private long windowStartedAt;
        private int count;

        private RequestCounter(long windowStartedAt) {
            this.windowStartedAt = windowStartedAt;
        }
    }
}
