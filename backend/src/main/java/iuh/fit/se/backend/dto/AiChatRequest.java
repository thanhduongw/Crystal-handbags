package iuh.fit.se.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AiChatRequest {
    private String sessionId;
    private String message;
}