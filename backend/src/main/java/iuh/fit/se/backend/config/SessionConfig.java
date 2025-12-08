package iuh.fit.se.backend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.context.annotation.Configuration;
import org.springframework.session.data.redis.config.annotation.web.http.EnableRedisHttpSession;
import org.springframework.session.web.http.SessionRepositoryFilter;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Configuration
@EnableRedisHttpSession(maxInactiveIntervalInSeconds = 1800)
public class SessionConfig implements BeanPostProcessor {

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) {
        if (bean instanceof SessionRepositoryFilter<?> srFilter) {
            // wrap filter để bỏ qua save nếu có JWT
            return new OncePerRequestFilter() {
                @Override
                protected void doFilterInternal(HttpServletRequest req,
                                                HttpServletResponse res,
                                                FilterChain chain)
                        throws ServletException, IOException {
                    if (req.getHeader("Authorization") != null) {
                        // không cho phép lưu session
                        req.setAttribute("org.springframework.session.web.http.SessionRepositoryFilter.FILTERED", Boolean.TRUE);
                    }
                    srFilter.doFilter(req, res, chain);
                }
            };
        }
        return bean;
    }
}
