package iuh.fit.se.backend.config;

import iuh.fit.se.backend.repository.VerificationTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Configuration
@EnableScheduling
@RequiredArgsConstructor
@Slf4j
public class ScheduledTasks {

    private final VerificationTokenRepository verificationTokenRepository;

    /**
     * Clean up expired verification tokens every day at 2 AM
     */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void cleanupExpiredTokens() {
        log.info("Starting cleanup of expired verification tokens");
        try {
            verificationTokenRepository.deleteByExpiryDateBefore(LocalDateTime.now());
            log.info("Successfully cleaned up expired verification tokens");
        } catch (Exception e) {
            log.error("Error cleaning up expired tokens", e);
        }
    }
}