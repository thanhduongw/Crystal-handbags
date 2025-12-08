package iuh.fit.se.backend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.lang.reflect.Method;

@Component
@Order(Ordered.LOWEST_PRECEDENCE)
@Slf4j
public class SessionExceptionHandlerFilter extends OncePerRequestFilter {

    private static final String SESSION_ATTR =
            "org.springframework.session.web.http.SessionRepositoryFilter.SESSION";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        try {
            chain.doFilter(request, response);
        } finally {
            // Luôn kiểm tra sau khi xử lý xong, không chờ status
            removeInvalidSessionIfNeed(request);
        }
    }

    private void removeInvalidSessionIfNeed(HttpServletRequest request) {
        try {
            Object session = request.getAttribute(SESSION_ATTR);
            if (session == null) return;

            // với Spring-Session-Redis 3.x
            Method isInvalidated = session.getClass().getMethod("isInvalidated");
            if ((Boolean) isInvalidated.invoke(session)) {
                request.removeAttribute(SESSION_ATTR);
                log.debug("Removed invalidated session from request");
            }
        } catch (Exception ignore) {
            // không phải RedisSession hoặc lỗi reflection -> bỏ qua
        }
    }
}