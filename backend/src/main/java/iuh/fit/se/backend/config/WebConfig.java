package iuh.fit.se.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${CORS_ALLOWED_ORIGIN_PATTERNS:http://localhost:5173,https://crystal-handbags.vercel.app}")
    private String corsAllowedOriginPatterns;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String[] allowedOrigins = Arrays.stream(corsAllowedOriginPatterns.split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .toArray(String[]::new);

        registry.addMapping("/api/**")
                .allowedOriginPatterns(allowedOrigins)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true); // cookie về browser
    }
}