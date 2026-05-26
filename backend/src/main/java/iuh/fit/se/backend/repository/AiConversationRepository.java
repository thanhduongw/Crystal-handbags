package iuh.fit.se.backend.repository;

import iuh.fit.se.backend.model.AiConversation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AiConversationRepository
        extends JpaRepository<AiConversation, Long> {

    Optional<AiConversation> findBySessionIdAndDeletedFalse(String sessionId);
}
