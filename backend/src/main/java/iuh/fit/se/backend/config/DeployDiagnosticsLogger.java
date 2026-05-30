package iuh.fit.se.backend.config;

import iuh.fit.se.backend.repository.CategoryRepository;
import iuh.fit.se.backend.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;

@Component
@RequiredArgsConstructor
@Slf4j
public class DeployDiagnosticsLogger {

    private final DataSource dataSource;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    @EventListener(ApplicationReadyEvent.class)
    public void logDatabaseStatus() {
        try (Connection connection = dataSource.getConnection()) {
            log.info("Database URL: {}", connection.getMetaData().getURL());
            log.info(
                    "Database seed check: categoryCount={}, productCount={}",
                    categoryRepository.count(),
                    productRepository.count());
        } catch (Exception ex) {
            log.warn("Failed to log database diagnostics", ex);
        }
    }
}
