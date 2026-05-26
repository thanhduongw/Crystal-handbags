package iuh.fit.se.backend.controller;

import iuh.fit.se.backend.dto.AiChatRequest;
import iuh.fit.se.backend.dto.AiChatResponse;
import iuh.fit.se.backend.dto.AiMessageResponse;
import iuh.fit.se.backend.service.AiChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiChatController {

    private final AiChatService aiChatService;

    @PostMapping("/chat")
    public ResponseEntity<AiChatResponse> chat(
            @RequestBody AiChatRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        return ResponseEntity.ok(aiChatService.chat(request, jwt));
    }

    @GetMapping("/conversations/{sessionId}/messages")
    public ResponseEntity<List<AiMessageResponse>> getMessages(
            @PathVariable String sessionId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        return ResponseEntity.ok(aiChatService.getMessages(sessionId, jwt));
    }

    @DeleteMapping("/conversations/{sessionId}")
    public ResponseEntity<Void> deleteConversation(
            @PathVariable String sessionId,
            @AuthenticationPrincipal Jwt jwt
    ) {
        aiChatService.deleteConversation(sessionId, jwt);
        return ResponseEntity.noContent().build();
    }
}