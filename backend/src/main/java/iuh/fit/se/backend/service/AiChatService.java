package iuh.fit.se.backend.service;

import iuh.fit.se.backend.dto.AiChatRequest;
import iuh.fit.se.backend.dto.AiChatResponse;
import iuh.fit.se.backend.dto.AiMessageResponse;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.List;

public interface AiChatService {
    AiChatResponse chat(AiChatRequest request, Jwt jwt);
    List<AiMessageResponse> getMessages(String sessionId, Jwt jwt);
    void deleteConversation(String sessionId, Jwt jwt);

}